"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: { name: string };
  isPublished: boolean;
  variants: { id: string }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-forest-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <img src="/data/LOGO.png" alt="nyaman.clo" className="h-8 w-auto brightness-0 invert" />
          <p className="font-display font-bold">NYAMAN FLOW</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm">
          <Link href="/admin" className="block px-3 py-2 rounded-lg hover:bg-white/10">Dashboard</Link>
          <Link href="/admin/products" className="block px-3 py-2 rounded-lg bg-white/10 font-semibold">Produk</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-ink-primary">Produk</h1>
            <Link href="/admin/products/new" className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-dark">
              Tambah Produk
            </Link>
          </div>

          {loading ? (
            <p className="text-ink-primary/60">Memuat...</p>
          ) : (
            <div className="bg-surface-card rounded-2xl border border-forest-primary/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background">
                  <tr className="text-left text-ink-primary/60">
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Varian</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-forest-primary/5">
                      <td className="py-3 px-4 font-medium text-ink-primary">{p.name}</td>
                      <td className="py-3 px-4">{p.category?.name}</td>
                      <td className="py-3 px-4 font-mono">{p.variants.length}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${p.isPublished ? "bg-green-100 text-status-ready" : "bg-gray-100 text-gray-600"}`}>
                          {p.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/admin/products/${p.id}/edit`} className="text-sm text-forest-primary hover:underline">Edit</Link>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-ink-primary/60">Belum ada produk.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}