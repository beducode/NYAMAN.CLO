"use client";

import { useEffect, useState } from "react";

type CartItem = { variantId: string; name: string; size: string; color: string; qty: number; price: number };

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", shippingAddress: "", orderType: "RETAIL" });
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("nf_cart");
    if (raw) setCart(JSON.parse(raw));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items: cart.map((c) => ({ variantId: c.variantId, quantity: c.qty })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(`Pesanan ${data.orderNumber} berhasil dibuat.`);
      localStorage.removeItem("nf_cart");
      setCart([]);
    } else {
      setResult(data.error || "Gagal");
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-display font-bold text-ink-primary mb-6">Checkout</h1>
        {cart.length === 0 && !result && <p className="text-ink-primary/60">Keranjang kosong.</p>}
        {cart.length > 0 && (
          <ul className="mb-6 space-y-2">
            {cart.map((c, i) => (
              <li key={i} className="bg-surface-card rounded-lg border border-forest-primary/10 p-3 text-sm">
                {c.name} — {c.color}/{c.size} × {c.qty}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6 space-y-4">
          <input placeholder="Nama" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" />
          <input placeholder="Telepon" required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" />
          <textarea placeholder="Alamat pengiriman" required value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" rows={3} />
          <select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2">
            <option value="RETAIL">Ritel</option>
            <option value="WHOLESALE">Grosir</option>
          </select>
          <button disabled={loading || cart.length === 0} className="w-full bg-forest-primary text-white rounded-lg py-3 font-semibold hover:bg-forest-dark disabled:opacity-60">
            {loading ? "Memproses..." : "Buat Pesanan"}
          </button>
        </form>
        {result && <p className="mt-4 text-sm text-forest-primary font-semibold">{result}</p>}
      </div>
    </main>
  );
}