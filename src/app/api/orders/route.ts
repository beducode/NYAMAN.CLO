import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { items: { include: { variant: { include: { product: true } } } }, payment: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      orderType: o.orderType,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({
        id: i.id,
        productName: i.variant.product.name,
        size: i.variant.size,
        color: i.variant.color,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
      paymentStatus: o.payment?.paymentStatus ?? null,
    }))
  );
}