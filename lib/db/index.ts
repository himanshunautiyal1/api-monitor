import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires explicit adapter + connection management.
// In dev, Next.js hot-reloads create new instances — the global singleton
// prevents "too many connections" errors and ensures the Pool is reused.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon serverless + Termux: keep the pool small to avoid hitting
    // Neon's connection limit on the free tier.
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }, // Required for Neon on Termux
  });

  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// ─── THE CRITICAL FIX ────────────────────────────────────────────────────────
// Prisma 7 does NOT auto-connect. You must call $connect() before any query.
// We do it once here at module load time so the checker cron never hits a
// "client not connected" silent failure.
// ─────────────────────────────────────────────────────────────────────────────
if (!globalForPrisma.prisma) {
  const client = createPrismaClient();
  globalForPrisma.prisma = client;

  // Connect immediately — do NOT leave this unawaited in production.
  client.$connect().catch((err) => {
    console.error("[DB] Failed to connect to Neon PostgreSQL:", err);
    process.exit(1);
  });
}

export const prisma = globalForPrisma.prisma;
