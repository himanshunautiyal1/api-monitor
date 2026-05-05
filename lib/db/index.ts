import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Pass a PoolConfig with proper idle/connection timeouts for Neon + Termux.
  // Neon's PgBouncer drops idle connections after ~60s, so we set idleTimeoutMillis
  // lower than that to force the internal pool to refresh stale connections.
  const adapter = new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL!,
      max: 5,
      // Kill idle connections before Neon's pooler does (Neon drops after ~60s)
      idleTimeoutMillis: 20000,
      // Don't wait forever for a connection
      connectionTimeoutMillis: 10000,
    },
    {
      // Log pool-level errors instead of crashing silently
      onPoolError: (err) => {
        console.error("Postgres pool error:", err.message);
      },
      onConnectionError: (err) => {
        console.error("Postgres connection error:", err.message);
      },
    },
  );

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in ALL environments — the cron checker needs a stable singleton.
// Next.js module caching handles deduplication, but this is a safety net.
globalForPrisma.prisma = prisma;

export default prisma;
