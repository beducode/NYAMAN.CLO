import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  const body = await req.json();
  const { customerName, customerPhone, shippingAddress, orderType, items } = body;

  if (!customerName || !customerPhone || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Data checkout tidak lengkap" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const prepared: { variantId: string; quantity: number; unitPrice: number; lineSubtotal: number }[] = [];

      for (const it of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: it.variantId } });
        if (!variant) throw new Error("Varian tidak ditemukan");
        const qty = Number(it.quantity);
        if (qty <= 0) throw new Error("Kuantitas tidak valid");
        if (variant.currentStock < qty) throw new Error(`Stok tidak cukup untuk ${variant.sku}`);

        const unitPrice = qty >= variant.minWholesaleQty ? Number(variant.wholesalePrice) : Number(variant.retailPrice);
        const lineSubtotal = unitPrice * qty;
        subtotal += lineSubtotal;
        prepared.push({ variantId: variant.id, quantity: qty, unitPrice, lineSubtotal });

        // conditional decrement
        const updated = await tx.productVariant.updateMany({
          where: { id: variant.id, currentStock: { gte: qty } },
          data: { currentStock: { decrement: qty } },
        });
        if (updated.count === 0) throw new Error(`Stok tidak cukup untuk ${variant.sku}`);

        const after = variant.currentStock - qty;
        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            userId: session?.userId ?? (await getOrCreateGuestUser(tx)),
            type: "OUT_ORDER",
            qtyChange: -qty,
            stockBefore: variant.currentStock,
            stockAfter: after,
            referenceId: "PENDING",
            notes: "Checkout",
          },
        });
      }

      const shippingCost = 0;
      const totalAmount = subtotal + shippingCost;

      const orderNumber = `INV-NYM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: session?.userId ?? null,
          customerName,
          customerPhone,
          shippingAddress,
          orderType: orderType || "RETAIL",
          status: "PENDING_PAYMENT",
          subtotal,
          shippingCost,
          totalAmount,
        },
      });

      for (const p of prepared) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: p.variantId,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            subtotal: p.lineSubtotal,
          },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: "TRANSFER_MANUAL",
          paymentStatus: "UNPAID",
        },
      });

      // fix reference id
      await tx.stockMovement.updateMany({
        where: { referenceId: "PENDING", variantId: { in: prepared.map((p) => p.variantId) } },
        data: { referenceId: order.id },
      });

      await tx.activityLog.create({
        data: {
          userId: session?.userId ?? (await getOrCreateGuestUser(tx)),
          action: "CREATE_ORDER",
          targetTable: "orders",
          targetId: order.id,
          newValues: { orderNumber, totalAmount },
        },
      });

      return order;
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, orderId: order.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal checkout" }, { status: 400 });
  }
}

async function getOrCreateGuestUser(tx: any) {
  // find or create a guest system user
  const existing = await tx.user.findFirst({ where: { email: "guest@nyaman.clo" } });
  if (existing) return existing.id;
  const role = await tx.role.findFirst({ where: { name: "Customer" } }) ?? await tx.role.findFirst();
  const u = await tx.user.create({
    data: {
      fullName: "Guest Customer",
      email: "guest@nyaman.clo",
      passwordHash: "!",
      roleId: role!.id,
    },
  });
  return u.id;
}