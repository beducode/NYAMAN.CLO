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
    prisma.category.upsert({ where: { slug: "dewasa" }, update: {}, create: { name: "Dewasa", slug: "dewasa", description: "Produk untuk dewasa" } }),
    prisma.category.upsert({ where: { slug: "anak" }, update: {}, create: { name: "Anak", slug: "anak", description: "Produk untuk anak" } }),
  ]);

  console.log("Seed complete. Super admin:", superAdmin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());