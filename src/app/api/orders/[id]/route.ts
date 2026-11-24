import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasPermission(session, "orders", "update")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { status, trackingNumber } = body;

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber } : {}),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "UPDATE_ORDER",
      targetTable: "orders",
      targetId: order.id,
      newValues: { status, trackingNumber },
    },
  });

  return NextResponse.json({ ok: true });
}