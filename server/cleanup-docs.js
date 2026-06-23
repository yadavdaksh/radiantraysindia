import { prisma } from "./config/db.js";

async function main() {
  console.log("Starting document cleanup...");
  
  // Find all documents with empty title or empty url
  const emptyDocs = await prisma.productDocument.findMany({
    where: {
      OR: [
        { title: "" },
        { url: "" }
      ]
    }
  });
  
  console.log(`Found ${emptyDocs.length} empty documents.`);
  
  if (emptyDocs.length > 0) {
    const deleteResult = await prisma.productDocument.deleteMany({
      where: {
        OR: [
          { title: "" },
          { url: "" }
        ]
      }
    });
    console.log(`Successfully deleted ${deleteResult.count} empty documents.`);
  }
}

main()
  .catch((err) => {
    console.error("Cleanup error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
