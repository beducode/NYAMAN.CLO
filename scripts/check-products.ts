import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  console.log("Products:", products, "Variants:", variants);
  const last = await prisma.product.findFirst({ orderBy: { createdAt: "desc" }, include: { variants: true } });
  if (last) console.log("Last product:", last.name, "variants:", last.variants.length);
}
main().finally(() => prisma.$disconnect());