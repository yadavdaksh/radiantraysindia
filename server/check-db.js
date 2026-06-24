import { prisma } from "./config/db.js";

async function main() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { productLinks: true }
        }
      }
    });
    console.log("=== DB CATEGORIES ===");
    categories.forEach(c => {
      console.log(`Name: "${c.name}", Slug: "${c.slug}", Active: ${c.isActive}, Products Count: ${c._count.productLinks}`);
    });
    
    // Let's also check if there are products not connected to categories, or their category info
    const products = await prisma.product.findMany({
      include: {
        categories: {
          include: { category: true }
        }
      },
      take: 10
    });
    console.log("\n=== SOME PRODUCTS & THEIR CATEGORIES ===");
    products.forEach(p => {
      console.log(`Product Name: "${p.name}", Slug: "${p.slug}"`);
      p.categories.forEach(pc => {
        console.log(`  -> Category Name: "${pc.category.name}", Slug: "${pc.category.slug}"`);
      });
    });
  } catch (error) {
    console.error("Error connecting to DB or running query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
