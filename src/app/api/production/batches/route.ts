import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "production", "create")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const body = await req.json();
  const { tailorLine, notes, items } = body;
  if (!tailorLine || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const batchCode = `BATCH-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.productionBatch.create({
        data: {
          batchCode,
          createdBy: session.userId,
          productionDate: new Date(),
          tailorLine,
          status: "STORED",
          notes: notes || null,
        },
      });

      for (const it of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: it.variantId } });
        if (!variant) throw new Error("Varian tidak ditemukan");
        const qtyGood = Number(it.qtyGood) || 0;
        const qtyReject = Number(it.qtyReject) || 0;
        if (qtyGood < 0 || qtyReject < 0) throw new Error("Kuantitas tidak valid");

        await tx.productionItem.create({
          data: {
            batchId: batch.id,
            variantId: it.variantId,
            qtyGood,
            qtyReject,
            unitHpp: variant.baseHpp,
          },
        });

        if (qtyGood > 0) {
          const stockBefore = variant.currentStock;
          const stockAfter = stockBefore + qtyGood;
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { currentStock: stockAfter },
          });
          await tx.stockMovement.create({
            data: {
              variantId: it.variantId,
              userId: session.userId,
              type: "IN_PRODUCTION",
              qtyChange: qtyGood,
              stockBefore,
              stockAfter,
              referenceId: batch.id,
              notes: `Batch ${batchCode}`,
            },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "INPUT_BATCH",
          targetTable: "production_batches",
          targetId: batch.id,
          newValues: { batchCode, tailorLine, items },
        },
      });

      return batch;
    });

    return NextResponse.json({ ok: true, batch: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal" }, { status: 500 });
  }
}