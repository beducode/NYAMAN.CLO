import { getSession, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();
  const isSuper = session?.roleName === "Super Admin";

  const [totalStock, todayProduction, pendingOrders, variants] = await Promise.all([
    prisma.productVariant.aggregate({ _sum: { currentStock: true } }),
    prisma.productionBatch.count({ where: { productionDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID"] } } }),
    prisma.productVariant.findMany({ include: { product: true }, orderBy: { currentStock: "asc" }, take: 8 }),
  ]);

  const hppValuation = isSuper
    ? await prisma.productVariant.aggregate({
        _sum: { currentStock: true },
      }).then(() => null)
    : null;

  // compute HPP valuation
  let valuation = 0;
  if (isSuper) {
    const all = await prisma.productVariant.findMany();
    valuation = all.reduce((a, v) => a + Number(v.baseHpp) * v.currentStock, 0);
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-forest-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img src="/data/LOGO.png" alt="nyaman.clo" className="h-8 w-auto brightness-0 invert" />
          <div>
            <p className="font-display font-bold">NYAMAN FLOW</p>
            <p className="text-xs text-white/60">Admin Panel</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <Link href="/admin" className="block px-3 py-2 rounded-lg bg-white/10 font-semibold">Dashboard</Link>
          <Link href="/admin/production/new" className="block px-3 py-2 rounded-lg hover:bg-white/10">Input Produksi</Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-lg hover:bg-white/10">Pesanan</Link>
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/70">{session?.roleName}</p>
          <form action="/api/auth/logout" method="post">
            <button className="mt-2 text-xs text-white/60 hover:text-white">Keluar</button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-ink-primary">Dashboard Eksekutif</h1>
            <Link href="/admin/production/new" className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-dark">
              Input Hasil Produksi
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard label="Total Stok Gudang" value={`${totalStock._sum.currentStock ?? 0} pcs`} />
            <KpiCard label="Batch Hari Ini" value={String(todayProduction)} />
            <KpiCard label="Pesanan Perlu Proses" value={String(pendingOrders)} />
            {isSuper && (
              <KpiCard label="Valuasi Aset HPP" value={`Rp ${valuation.toLocaleString("id-ID")}`} dark />
            )}
          </div>

          <div className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6">
            <h2 className="font-display font-semibold text-ink-primary mb-4">Matriks Stok Real-Time</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-primary/60 border-b border-forest-primary/10">
                    <th className="py-2 pr-4">Produk</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Ukuran</th>
                    <th className="py-2 pr-4">Stok</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-b border-forest-primary/5">
                      <td className="py-2 pr-4">{v.product.name}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{v.sku}</td>
                      <td className="py-2 pr-4 font-mono">{v.size}</td>
                      <td className="py-2 pr-4 font-mono">{v.currentStock}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${v.currentStock <= 0 ? "bg-red-100 text-status-out" : v.currentStock <= v.lowStockThreshold ? "bg-amber-100 text-status-low" : "bg-green-100 text-status-ready"}`}>
                          {v.currentStock <= 0 ? "Habis" : v.currentStock <= v.lowStockThreshold ? "Menipis" : "Ready"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border ${dark ? "bg-forest-primary text-white border-forest-primary" : "bg-surface-card border-forest-primary/10"}`}>
      <p className={`text-xs ${dark ? "text-white/70" : "text-ink-primary/60"}`}>{label}</p>
      <p className={`text-2xl font-mono font-bold mt-2 ${dark ? "text-ochre-accent" : "text-ink-primary"}`}>{value}</p>
    </div>
  );
}