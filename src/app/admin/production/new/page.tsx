"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Variant = { id: string; size: string; color: string };
type Product = { id: string; name: string; variants: Variant[] };

export default function ProductionNewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [tailorLine, setTailorLine] = useState("");
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState<Record<string, { good: number; reject: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data));
  }, []);

  const product = products.find((p) => p.id === productId);
  // group variants by size (unique)
  const sizes = product ? Array.from(new Set(product.variants.map((v) => v.size))) : [];

  useEffect(() => {
    if (!product) return;
    const init: Record<string, { good: number; reject: number }> = {};
    for (const s of sizes) init[s] = { good: 0, reject: 0 };
    setQty(init);
  }, [productId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    setError("");
    const items = sizes
      .map((s) => {
        const v = product.variants.find((x) => x.size === s);
        if (!v) return null;
        return { variantId: v.id, qtyGood: qty[s]?.good ?? 0, qtyReject: qty[s]?.reject ?? 0 };
      })
      .filter(Boolean);

    const res = await fetch("/api/production/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, tailorLine, notes, items }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gagal menyimpan");
    }
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
          <a href="/admin/production/new" className="block px-3 py-2 rounded-lg bg-white/10 font-semibold">Input Produksi</a>
          <a href="/admin/orders" className="block px-3 py-2 rounded-lg hover:bg-white/10">Pesanan</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-display font-bold text-ink-primary mb-6">Input Hasil Produksi</h1>
          <form onSubmit={onSubmit} className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Produk</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2">
                <option value="">Pilih produk...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lini Jahit / Vendor</label>
              <input value={tailorLine} onChange={(e) => setTailorLine(e.target.value)} required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" />
            </div>
            {sizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Lolos QC per Ukuran</label>
                <div className="grid grid-cols-5 gap-3">
                  {sizes.map((s) => (
                    <div key={s} className="border border-forest-primary/20 rounded-lg p-3">
                      <p className="text-center font-mono font-bold text-forest-primary mb-2">{s}</p>
                      <label className="text-xs text-ink-primary/60">Lolos QC</label>
                      <input type="number" min={0} value={qty[s]?.good ?? 0} onChange={(e) => setQty((q) => ({ ...q, [s]: { ...q[s], good: Number(e.target.value) } }))} className="w-full rounded border border-forest-primary/20 px-2 py-1 text-sm mb-2" />
                      <label className="text-xs text-ink-primary/60">Reject</label>
                      <input type="number" min={0} value={qty[s]?.reject ?? 0} onChange={(e) => setQty((q) => ({ ...q, [s]: { ...q[s], reject: Number(e.target.value) } }))} className="w-full rounded border border-forest-primary/20 px-2 py-1 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Catatan</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" rows={3} />
            </div>
            {error && <p className="text-sm text-status-out">{error}</p>}
            <button disabled={loading || !productId} className="w-full bg-forest-primary text-white rounded-lg py-3 font-semibold hover:bg-forest-dark disabled:opacity-60">
              {loading ? "Menyimpan..." : "Simpan & Update Stok Live"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}