"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  totalAmount: number;
  trackingNumber: string | null;
  createdAt: string;
  items: { id: string; productName: string; size: string; color: string; quantity: number }[];
  paymentStatus: string | null;
};

const statuses = ["PENDING_PAYMENT", "PAID", "PACKING", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  async function saveResi(id: string, trackingNumber: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackingNumber }) });
    load();
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-forest-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img src="/data/LOGO.png" alt="nyaman.clo" className="h-8 w-auto brightness-0 invert" />
          <p className="font-display font-bold">NYAMAN FLOW</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <a href="/admin" className="block px-3 py-2 rounded-lg hover:bg-white/10">Dashboard</a>
          <a href="/admin/production/new" className="block px-3 py-2 rounded-lg hover:bg-white/10">Input Produksi</a>
          <a href="/admin/orders" className="block px-3 py-2 rounded-lg bg-white/10 font-semibold">Pesanan</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-display font-bold text-ink-primary mb-6">Fulfillment & Packing</h1>
          {loading ? (
            <p className="text-ink-primary/60">Memuat...</p>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-surface-card rounded-2xl border border-forest-primary/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-forest-primary">{o.orderNumber}</p>
                      <p className="text-sm text-ink-primary">{o.customerName} · {o.orderType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="rounded-lg border border-forest-primary/20 px-3 py-1.5 text-sm"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ul className="text-sm text-ink-primary/80 mb-3">
                    {o.items.map((i) => (
                      <li key={i.id}>{i.productName} — {i.color} / {i.size} × {i.quantity}</li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={o.trackingNumber ?? ""}
                      placeholder="Nomor resi"
                      onBlur={(e) => saveResi(o.id, e.target.value)}
                      className="flex-1 rounded-lg border border-forest-primary/20 px-3 py-1.5 text-sm font-mono"
                    />
                    <span className="text-xs text-ink-primary/60">Total: Rp {o.totalAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-ink-primary/60">Belum ada pesanan.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}