import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.$executeRawUnsafe("TRUNCATE TABLE order_items, payments, orders, stock_movements, production_items, production_batches, product_variants, products, categories RESTART IDENTITY CASCADE"),
  ]);
  console.log("All product-related data deleted.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());