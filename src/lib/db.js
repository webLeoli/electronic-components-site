import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Cache Prisma instance globally to prevent connection pool exhaustion
// during hot module replacement in development AND production
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
