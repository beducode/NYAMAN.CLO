import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  const data = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    materialType: p.materialType,
    category: p.category.name,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      retailPrice: Number(v.retailPrice),
      wholesalePrice: Number(v.wholesalePrice),
      minWholesaleQty: v.minWholesaleQty,
      currentStock: v.currentStock,
      lowStockThreshold: v.lowStockThreshold,
      stockStatus:
        v.currentStock <= 0 ? "out" : v.currentStock <= v.lowStockThreshold ? "low" : "ready",
    })),
  }));

  return NextResponse.json(data);
}