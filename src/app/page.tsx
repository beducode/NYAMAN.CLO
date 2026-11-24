import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-surface-card border-b border-forest-primary/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/data/LOGO.png" alt="nyaman.clo" className="h-9 w-auto" />
            <span className="font-display font-bold text-forest-primary text-lg">nyaman.clo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-primary">
            <a href="#" className="hover:text-forest-primary">Semua Koleksi</a>
            <a href="#" className="hover:text-forest-primary">Heavyweight Tee</a>
            <a href="#" className="hover:text-forest-primary">Workshirt & Polo</a>
            <a href="#" className="hover:text-forest-primary">Outerwear</a>
            <a href="/admin/login" className="text-forest-primary">Admin</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="#" className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-dark">Order Makloon</a>
            <button className="bg-forest-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-dark">Keranjang</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-forest-dark to-forest-primary text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold leading-tight">
              Konveksi Presisi & Nyaman
            </h1>
            <p className="mt-4 text-white/80 text-lg">
              Koleksi apparel premium dengan stok gudang live. Harga eceran dan grosir otomatis.
            </p>
            <a href="#koleksi" className="inline-block mt-6 bg-ochre-accent text-ink-primary px-6 py-3 rounded-lg font-semibold hover:bg-ochre-hover">
              Beli Sekarang
            </a>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
            <p className="text-sm font-medium text-white/80">Status Gudang Live</p>
            <p className="text-3xl font-mono font-bold mt-2">
              {products.reduce((a, p) => a + p.variants.reduce((b, v) => b + v.currentStock, 0), 0)} pcs
            </p>
            <p className="text-xs text-white/60 mt-1">Total stok ready real-time</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="koleksi" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-display font-bold text-ink-primary mb-8">Semua Koleksi</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                materialType: p.materialType,
                category: p.category.name,
                variants: p.variants.map((v) => ({
                  id: v.id,
                  color: v.color,
                  size: v.size,
                  retailPrice: Number(v.retailPrice),
                  wholesalePrice: Number(v.wholesalePrice),
                  minWholesaleQty: v.minWholesaleQty,
                  currentStock: v.currentStock,
                  lowStockThreshold: v.lowStockThreshold,
                  stockStatus: v.currentStock <= 0 ? "out" : v.currentStock <= v.lowStockThreshold ? "low" : "ready",
                })),
              }}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-forest-primary/10 py-8 text-center text-sm text-ink-primary/60">
        <img src="/data/LOGO.png" alt="nyaman.clo" className="h-8 w-auto mx-auto mb-2" />
        © {new Date().getFullYear()} nyaman.clo — NYAMAN FLOW
      </footer>
    </main>
  );
}