const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shortest = await prisma.$queryRaw`
    SELECT "partNumber", specs, length(specs) as len 
    FROM "Product" 
    ORDER BY length(specs) ASC
    LIMIT 5
  `;
  console.log('Shortest specs:', shortest);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
