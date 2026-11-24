"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Category = { id: number; name: string };
type Variant = {
  color: string;
  size: string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  currentStock: number;
  lowStockThreshold: number;
  chestCircumference: number | null;
  shirtLength: number | null;
  pantsLength: number | null;
  waistWidth: number | null;
  sleeveLength: number | null;
  armpitCircumference: number | null;
  armCircumference: number | null;
  estimatedAge: string | null;
};

const MODEL_OPTIONS = ["Daster","Gamis","Celana","Kemeja","Dress","Koko Pendek","Koko Panjang","Tunik","Oneset"];

function sizeRank(s: string) {
  const map: Record<string, number> = { XXS:1, XS:2, S:3, M:4, L:5, XL:6, XXL:7, "2XL":7, XXXL:8, "3XL":8, "4XL":9, "5XL":10 };
  const key = s.trim().toUpperCase();
  if (map[key]) return map[key];
  const num = parseInt(key, 10);
  return isNaN(num) ? 1000 : 100 + num;
}
function sortSizes(list: string[]) {
  return Array.from(new Set(list)).sort((a, b) => {
    const ra = sizeRank(a), rb = sizeRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "id");
  });
}
function ageRank(s: string) { const num = parseInt(s, 10); return isNaN(num) ? 999 : num; }
function titleCase(s: string) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }
function sortEstimatedAges(list: string[]) {
  return Array.from(new Set(list)).sort((a, b) => {
    const ra = ageRank(a), rb = ageRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "id");
  });
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");

  const [model, setModel] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [estimatedAges, setEstimatedAges] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [estimatedAgeInput, setEstimatedAgeInput] = useState("");

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d));
    fetch(`/api/admin/products/${id}`).then((r) => r.json()).then((p) => {
      setName(p.name || "");
      setModel(p.model || "");
      setCategoryId(String(p.categoryId || ""));
      setIsPublished(Boolean(p.isPublished));
      const vs = p.variants || [];
      setVariants(vs.map((v: any) => ({
        color: v.color, size: v.size,
        retailPrice: v.retailPrice, wholesalePrice: v.wholesalePrice,
        minWholesaleQty: v.minWholesaleQty, currentStock: v.currentStock,
        lowStockThreshold: v.lowStockThreshold,
        chestCircumference: v.chestCircumference, shirtLength: v.shirtLength,
        pantsLength: v.pantsLength, waistWidth: v.waistWidth,
        sleeveLength: v.sleeveLength, armpitCircumference: v.armpitCircumference,
        armCircumference: v.armCircumference, estimatedAge: v.estimatedAge,
      })));
      setSizes(sortSizes(Array.from(new Set(vs.map((v: any) => v.size)))));
      setColors(Array.from(new Set(vs.map((v: any) => v.color))));
      setEstimatedAges(sortEstimatedAges(Array.from(new Set(vs.map((v: any) => v.estimatedAge).filter(Boolean)))));
      setFetching(false);
    });
  }, [id]);

  const selectedCategory = categories.find((c) => c.id === Number(categoryId));
  const isAnak = selectedCategory?.name === "Anak";

  function addSize() {
    const items = sizeInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return;
    setSizes((prev) => sortSizes([...prev, ...items]));
    setSizeInput("");
  }
  function addColor() {
    const items = colorInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return;
    setColors((prev) => Array.from(new Set([...prev, ...items])));
    setColorInput("");
  }
  function addVariant() {
    setVariants((prev) => [...prev, {
      color: colors[0] || "", size: sizes[0] || "",
      retailPrice: 0, wholesalePrice: 0, minWholesaleQty: 12,
      currentStock: 0, lowStockThreshold: 5,
      chestCircumference: null, shirtLength: null, pantsLength: null,
      waistWidth: null, sleeveLength: null, armpitCircumference: null,
      armCircumference: null, estimatedAge: null,
    }]);
  }
  function updateVariant(idx: number, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function removeVariant(idx: number) {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function generateVariants() {
    const cList = colors.length ? colors : [""];
    const sList = sizes.length ? sizes : [""];
    const aList = isAnak && estimatedAges.length ? estimatedAges : [null];
    const combos: Variant[] = [];
    for (const c of cList) {
      for (const s of sList) {
        for (const a of aList) {
          combos.push({
            color: c,
            size: s,
            retailPrice: 0,
            wholesalePrice: 0,
            minWholesaleQty: 12,
            currentStock: 0,
            lowStockThreshold: 5,
            chestCircumference: null,
            shirtLength: null,
            pantsLength: null,
            waistWidth: null,
            sleeveLength: null,
            armpitCircumference: null,
            armCircumference: null,
            estimatedAge: a,
          });
        }
      }
    }
    setVariants(combos);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !categoryId) { setError("Nama dan kategori wajib diisi"); return; }
    if (variants.length === 0) { setError("Minimal satu varian"); return; }
    setLoading(true); setError("");
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, model, categoryId: Number(categoryId), isPublished, variants }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push("/admin/products");
    else setError(data.error || "Gagal menyimpan");
  }

  if (fetching) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-forest-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img src="/data/LOGO.png" alt="nyaman.clo" className="h-8 w-auto brightness-0 invert" />
          <p className="font-display font-bold">NYAMAN FLOW</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <a href="/admin" className="block px-3 py-2 rounded-lg hover:bg-white/10">Dashboard</a>
          <a href="/admin/products" className="block px-3 py-2 rounded-lg bg-white/10 font-semibold">Produk</a>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-display font-bold text-ink-primary mb-6">Edit Produk</h1>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Produk</label>
                <input value={name} onChange={(e) => setName(titleCase(e.target.value))} required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full rounded-lg border border-forest-primary/20 px-3 py-2">
                  <option value="">Pilih kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-lg border border-forest-primary/20 px-3 py-2">
                  <option value="">Pilih model...</option>
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                Published (tampil di storefront)
              </label>
            </div>

            <div className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6 space-y-4">
              <h2 className="font-display font-semibold text-ink-primary">Daftar Ukuran</h2>
              <div className="flex gap-2">
                <input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} placeholder="Tambah ukuran (mis. XXL, 3-4T)" className="flex-1 rounded-lg border border-forest-primary/20 px-3 py-2 text-sm" />
                <button type="button" onClick={addSize} className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm">Tambah</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <span key={s} className="text-xs px-2 py-1 rounded bg-forest-primary/10 text-forest-primary font-mono flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => { setSizes((prev) => prev.filter((x) => x !== s)); setVariants((prev) => prev.filter((v) => v.size !== s)); }} className="text-forest-primary/60 hover:text-status-out">&times;</button>
                  </span>
                ))}
              </div>

              {isAnak && (
                <>
                  <h2 className="font-display font-semibold text-ink-primary mt-4">Daftar Perkiraan Usia</h2>
                  <div className="flex gap-2">
                    <input value={estimatedAgeInput} onChange={(e) => setEstimatedAgeInput(e.target.value)} placeholder="Tambah perkiraan usia (mis. 2-3 tahun)" className="flex-1 rounded-lg border border-forest-primary/20 px-3 py-2 text-sm" />
                    <button type="button" onClick={() => {
                      const items = estimatedAgeInput.split(",").map((s) => s.trim()).filter(Boolean);
                      if (items.length === 0) return;
                      setEstimatedAges((prev) => sortEstimatedAges([...prev, ...items]));
                      setEstimatedAgeInput("");
                    }} className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm">Tambah</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {estimatedAges.map((a) => (
                      <span key={a} className="text-xs px-2 py-1 rounded bg-forest-primary/10 text-forest-primary flex items-center gap-1">
                        {a}
                        <button type="button" onClick={() => { setEstimatedAges((prev) => prev.filter((x) => x !== a)); setVariants((prev) => prev.filter((v) => v.estimatedAge !== a)); }} className="text-forest-primary/60 hover:text-status-out">&times;</button>
                      </span>
                    ))}
                  </div>
                </>
              )}

              <h2 className="font-display font-semibold text-ink-primary mt-4">Daftar Warna/Motif</h2>
              <div className="flex gap-2">
                <input value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="Tambah warna/motif" className="flex-1 rounded-lg border border-forest-primary/20 px-3 py-2 text-sm" />
                <button type="button" onClick={addColor} className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm">Tambah</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <span key={c} className="text-xs px-2 py-1 rounded bg-ochre-accent/20 text-ochre-hover flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => { setColors((prev) => prev.filter((x) => x !== c)); setVariants((prev) => prev.filter((v) => v.color !== c)); }} className="text-ochre-hover/60 hover:text-status-out">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-surface-card rounded-2xl border border-forest-primary/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-ink-primary">Varian Produk</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={generateVariants} className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Generate Varian</button>
                  <button type="button" onClick={addVariant} className="bg-ochre-accent text-ink-primary px-4 py-2 rounded-lg text-sm font-semibold">+ Tambah Varian</button>
                </div>
              </div>

              {variants.length === 0 && <p className="text-sm text-ink-primary/60">Belum ada varian.</p>}

              <div className="space-y-4">
                {variants.map((v, idx) => (
                  <div key={idx} className="border border-forest-primary/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-primary">Varian #{idx + 1}</p>
                      <button type="button" onClick={() => removeVariant(idx)} className="text-xs text-status-out">Hapus</button>
                    </div>
                    <p className="text-sm font-semibold text-ink-primary">
                      {v.color || "-"} / {v.size || "-"}{v.estimatedAge ? ` (${v.estimatedAge})` : ""}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs mb-1">Harga Eceran</label>
                        <input type="number" min={0} value={v.retailPrice} onChange={(e) => updateVariant(idx, { retailPrice: Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Harga Grosir</label>
                        <input type="number" min={0} value={v.wholesalePrice} onChange={(e) => updateVariant(idx, { wholesalePrice: Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Min Grosir (pcs)</label>
                        <input type="number" min={1} value={v.minWholesaleQty} onChange={(e) => updateVariant(idx, { minWholesaleQty: Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Stok</label>
                        <input type="number" min={0} value={v.currentStock} onChange={(e) => updateVariant(idx, { currentStock: Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Minimal Stok</label>
                        <input type="number" min={0} value={v.lowStockThreshold} onChange={(e) => updateVariant(idx, { lowStockThreshold: Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink-primary/70 mb-2">Ukuran Tubuh (cm)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div><label className="block text-xs mb-1">Lingkar Dada</label><input type="number" min={0} step="0.1" value={v.chestCircumference ?? ""} onChange={(e) => updateVariant(idx, { chestCircumference: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Panjang Baju</label><input type="number" min={0} step="0.1" value={v.shirtLength ?? ""} onChange={(e) => updateVariant(idx, { shirtLength: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Panjang Celana</label><input type="number" min={0} step="0.1" value={v.pantsLength ?? ""} onChange={(e) => updateVariant(idx, { pantsLength: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Lebar Pinggang</label><input type="number" min={0} step="0.1" value={v.waistWidth ?? ""} onChange={(e) => updateVariant(idx, { waistWidth: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Panjang Tangan</label><input type="number" min={0} step="0.1" value={v.sleeveLength ?? ""} onChange={(e) => updateVariant(idx, { sleeveLength: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Lingkar Ketiak</label><input type="number" min={0} step="0.1" value={v.armpitCircumference ?? ""} onChange={(e) => updateVariant(idx, { armpitCircumference: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                        <div><label className="block text-xs mb-1">Lingkar Tangan</label><input type="number" min={0} step="0.1" value={v.armCircumference ?? ""} onChange={(e) => updateVariant(idx, { armCircumference: e.target.value === "" ? null : Number(e.target.value) })} className="w-full rounded-lg border border-forest-primary/20 px-2 py-1.5 text-sm" /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <datalist id="colors-list">
                {colors.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            {error && <p className="text-sm text-status-out">{error}</p>}
            <button disabled={loading} className="w-full bg-forest-primary text-white rounded-lg py-3 font-semibold hover:bg-forest-dark disabled:opacity-60">
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}