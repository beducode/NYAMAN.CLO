import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Roles
  const roles = await Promise.all([
    prisma.role.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Super Admin", permissions: { products: ["*"], orders: ["*"], production: ["*"], inventory: ["*"], users: ["*"], reports: ["*"] } } }),
    prisma.role.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "Admin Gudang & Produksi", permissions: { production: ["create", "read"], inventory: ["read", "opname"], products: ["read"] } } }),
    prisma.role.upsert({ where: { id: 3 }, update: {}, create: { id: 3, name: "Admin Penjualan & CS", permissions: { products: ["read", "update"], orders: ["read", "update"], customers: ["read"] } } }),
    prisma.role.upsert({ where: { id: 4 }, update: {}, create: { id: 4, name: "Staf Packing", permissions: { orders: ["read", "update_status"] } } }),
    prisma.role.upsert({ where: { id: 5 }, update: {}, create: { id: 5, name: "Customer", permissions: { orders: ["read_own"] } } }),
  ]);

  const superAdmin = await prisma.user.upsert({
    where: { email: "owner@nyaman.clo" },
    update: {},
    create: {
      fullName: "Owner nyaman.clo",
      email: "owner@nyaman.clo",
      passwordHash: await bcrypt.hash("admin123", 10),
      roleId: 1,
      phone: "08123456789",
    },
  });

  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { slug: "heavyweight-tee" }, update: {}, create: { name: "Heavyweight Tee", slug: "heavyweight-tee", description: "Kaos heavyweight premium" } }),
    prisma.category.upsert({ where: { slug: "workshirt-polo" }, update: {}, create: { name: "Workshirt & Polo", slug: "workshirt-polo", description: "Workshirt dan polo" } }),
    prisma.category.upsert({ where: { slug: "outerwear" }, update: {}, create: { name: "Outerwear", slug: "outerwear", description: "Jaket dan outerwear" } }),
  ]);

  const productsData = [
    { name: "Heavyweight Tee", slug: "heavyweight-tee", cat: cats[0].id, material: "Cotton Combed 24s", price: 85000, wholesale: 65000 },
    { name: "Workshirt Classic", slug: "workshirt-classic", cat: cats[1].id, material: "Twil", price: 120000, wholesale: 95000 },
    { name: "Cargo Pants", slug: "cargo-pants", cat: cats[2].id, material: "Ripstop", price: 180000, wholesale: 140000 },
    { name: "Outerwear Jacket", slug: "outerwear-jacket", cat: cats[2].id, material: "Fleece", price: 250000, wholesale: 200000 },
  ];

  const colors = ["Black", "White", "Navy"];
  const sizes = ["S", "M", "L", "XL", "XXL"];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: p.cat,
        materialType: p.material,
        isPublished: true,
        description: `${p.name} dari nyaman.clo`,
      },
    });

    for (const color of colors) {
      for (const size of sizes) {
        const sku = `NYM-${p.slug.toUpperCase().replace(/-/g, "")}-${color.toUpperCase().slice(0, 3)}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            sku,
            color,
            size,
            baseHpp: Math.round(p.price * 0.45),
            retailPrice: p.price,
            wholesalePrice: p.wholesale,
            minWholesaleQty: 12,
            currentStock: Math.floor(Math.random() * 40) + 5,
            lowStockThreshold: 5,
            barcodeCode: `BC-${sku}`,
          },
        });
      }
    }
  }

  console.log("Seed complete. Super admin:", superAdmin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());