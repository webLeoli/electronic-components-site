import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const dbUrl = process.env.DATABASE_URL || '';
const separator = dbUrl.includes('?') ? '&' : '?';

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: `${dbUrl}${separator}connection_limit=20&pool_timeout=30`,
    },
  },
});

// Cache Prisma instance globally to prevent connection pool exhaustion
// during hot module replacement in development AND production
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
