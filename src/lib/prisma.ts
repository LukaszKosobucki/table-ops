import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  const envLocalPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envLocalPath)) {
    process.loadEnvFile(envLocalPath);
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  'postgresql://postgres:postgres@localhost:5432/tableops?schema=public';

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.DEBUG_PRISMA ? ['query', 'error', 'warn'] : ['warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
