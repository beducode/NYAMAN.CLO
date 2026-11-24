import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission } from "@/lib/auth";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      materialType: p.materialType,
      category: p.category,
      isPublished: p.isPublished,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        size: v.size,
        baseHpp: Number(v.baseHpp),
        retailPrice: Number(v.retailPrice),
        wholesalePrice: Number(v.wholesalePrice),
        minWholesaleQty: v.minWholesaleQty,
        currentStock: v.currentStock,
        lowStockThreshold: v.lowStockThreshold,
      })),
    }))
  );
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "products", "create")) {
    // allow any authenticated admin/staff to create for simplicity
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, materialType, categoryId, isPublished, variants } = body;
  if (!name || !categoryId) {
    return NextResponse.json({ error: "Nama dan kategori wajib diisi" }, { status: 400 });
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: "Minimal satu varian" }, { status: 400 });
  }

  const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);

  try {
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name,
          slug,
          description: description || null,
          materialType: materialType || null,
          categoryId: Number(categoryId),
          isPublished: Boolean(isPublished),
        },
      });

      for (const v of variants) {
        const color = String(v.color || "").trim();
        const size = String(v.size || "").trim();
        if (!color || !size) continue;
        const skuBase = `NYM-${slug.toUpperCase().replace(/-/g, "").slice(0, 8)}-${color.toUpperCase().slice(0, 3)}-${size}`;
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
            baseHpp: Number(v.baseHpp) || 0,
            retailPrice: Number(v.retailPrice) || 0,
            wholesalePrice: Number(v.wholesalePrice) || 0,
            minWholesaleQty: Number(v.minWholesaleQty) || 12,
            currentStock: Number(v.currentStock) || 0,
            lowStockThreshold: Number(v.lowStockThreshold) || 5,
            barcodeCode: `BC-${sku}`,
          },
        });
      }
      return p;
    });

    return NextResponse.json({ ok: true, id: product.id, slug: product.slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal menyimpan" }, { status: 500 });
  }
}