"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  color: string;
  size: string;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  currentStock: number;
  lowStockThreshold: number;
  stockStatus: "ready" | "low" | "out";
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  materialType: string | null;
  category: string;
  variants: Variant[];
};

export default function ProductCard({ product }: { product: Product }) {
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(product.variants.find((v) => v.color === colors[0])?.size ?? "M");
  const [qty, setQty] = useState(1);

  const variant = useMemo(
    () => product.variants.find((v) => v.color === color && v.size === size),
    [product.variants, color, size]
  );

  const price = useMemo(() => {
    if (!variant) return 0;
    if (qty >= variant.minWholesaleQty) return variant.wholesalePrice;
    return variant.retailPrice;
  }, [variant, qty]);

  const sizes = Array.from(new Set(product.variants.filter((v) => v.color === color).map((v) => v.size)));

  return (
    <div className="bg-surface-card rounded-2xl border border-forest-primary/10 overflow-hidden flex flex-col">
      <div className="aspect-square bg-background flex items-center justify-center">
        <span className="text-forest-primary/30 text-sm">Foto Produk</span>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-xs text-ink-primary/60">{product.category}</p>
          <h3 className="font-display font-semibold text-ink-primary">{product.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                const first = product.variants.find((v) => v.color === c)?.size;
                if (first) setSize(first);
              }}
              className={`text-xs px-2 py-1 rounded border ${color === c ? "bg-forest-primary text-white border-forest-primary" : "border-forest-primary/20"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {sizes.map((s) => {
            const v = product.variants.find((x) => x.color === color && x.size === s);
            const active = size === s;
            return (
              <button
                key={s}
                onClick={() => setSize(s)}
                disabled={!v || v.currentStock <= 0}
                className={`text-xs w-8 h-8 rounded border font-mono ${active ? "bg-forest-primary text-white border-forest-primary" : "border-forest-primary/20"} ${!v || v.currentStock <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-mono font-bold text-forest-primary">
            Rp {price.toLocaleString("id-ID")}
          </span>
          {variant && qty >= variant.minWholesaleQty && (
            <span className="text-xs bg-ochre-accent/20 text-ochre-hover px-2 py-0.5 rounded">Grosir</span>
          )}
        </div>
        {variant && (
          <p className="text-xs text-ink-primary/60">
            Stok:{" "}
            <span className={variant.stockStatus === "out" ? "text-status-out" : variant.stockStatus === "low" ? "text-status-low" : "text-status-ready"}>
              {variant.currentStock} pcs
            </span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded border border-forest-primary/20 px-2 py-1 text-sm"
          />
          <button
            disabled={!variant || variant.currentStock <= 0}
            onClick={() => {
              if (!variant) return;
              const raw = localStorage.getItem("nf_cart");
              const cart = raw ? JSON.parse(raw) : [];
              cart.push({ variantId: variant.id, name: product.name, size: variant.size, color: variant.color, qty, price });
              localStorage.setItem("nf_cart", JSON.stringify(cart));
              alert("Ditambahkan ke keranjang");
            }}
            className="flex-1 bg-ochre-accent text-ink-primary rounded-lg py-2 text-sm font-semibold hover:bg-ochre-hover disabled:opacity-50"
          >
            + Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}