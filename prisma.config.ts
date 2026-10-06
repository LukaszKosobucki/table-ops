import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@prisma/config';

// Load .env.local if present (Next.js environment standard)
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envLocalPath);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/tableops?schema=public',
  },
});
