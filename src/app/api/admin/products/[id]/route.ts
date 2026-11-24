import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, variants: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    model: product.model,
    categoryId: product.categoryId,
    category: product.category,
    isPublished: product.isPublished,
    variants: product.variants.map((v) => ({
      id: v.id,
      color: v.color,
      size: v.size,
      retailPrice: Number(v.retailPrice),
      wholesalePrice: Number(v.wholesalePrice),
      minWholesaleQty: v.minWholesaleQty,
      currentStock: v.currentStock,
      lowStockThreshold: v.lowStockThreshold,
      chestCircumference: v.chestCircumference,
      shirtLength: v.shirtLength,
      pantsLength: v.pantsLength,
      waistWidth: v.waistWidth,
      sleeveLength: v.sleeveLength,
      armpitCircumference: v.armpitCircumference,
      armCircumference: v.armCircumference,
      estimatedAge: v.estimatedAge,
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, description, model, categoryId, isPublished, variants } = body;

  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          description: description ?? null,
          model: model || null,
          ...(categoryId ? { categoryId: Number(categoryId) } : {}),
          ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        },
      });

      if (Array.isArray(variants)) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        for (const v of variants) {
          const color = String(v.color || "").trim();
          const size = String(v.size || "").trim();
          if (!color || !size) continue;
          const skuBase = `NYM-${p.slug.toUpperCase().replace(/-/g, "").slice(0, 8)}-${color.toUpperCase().slice(0, 3)}-${size}`;
          let sku = skuBase;
          let i = 1;
          while (await tx.productVariant.findUnique({ where: { sku } })) {
            sku = `${skuBase}-${i++}`;
          }
          await tx.productVariant.create({
            data: {
              productId: p.id,
              sku,
              color,
              size,
              baseHpp: 0,
              retailPrice: Number(v.retailPrice) || 0,
              wholesalePrice: Number(v.wholesalePrice) || 0,
              minWholesaleQty: Number(v.minWholesaleQty) || 12,
              currentStock: Number(v.currentStock) || 0,
              lowStockThreshold: Number(v.lowStockThreshold) || 5,
              chestCircumference: v.chestCircumference ? Number(v.chestCircumference) : null,
              shirtLength: v.shirtLength ? Number(v.shirtLength) : null,
              pantsLength: v.pantsLength ? Number(v.pantsLength) : null,
              waistWidth: v.waistWidth ? Number(v.waistWidth) : null,
              sleeveLength: v.sleeveLength ? Number(v.sleeveLength) : null,
              armpitCircumference: v.armpitCircumference ? Number(v.armpitCircumference) : null,
              armCircumference: v.armCircumference ? Number(v.armCircumference) : null,
              estimatedAge: v.estimatedAge || null,
              barcodeCode: `BC-${sku}`,
            },
          });
        }
      }

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: "UPDATE_PRODUCT",
          targetTable: "products",
          targetId: p.id,
          newValues: { name, model, variants: variants?.length },
        },
      });

      return p;
    });

    return NextResponse.json({ ok: true, id: product.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "DELETE_PRODUCT",
          targetTable: "products",
          targetId: id,
          newValues: {},
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal menghapus" }, { status: 500 });
  }
}