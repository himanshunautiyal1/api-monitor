import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const resolvedUrl = process.env._DB_RESOLVED_URL;
  const originalHost = process.env._DB_ORIGINAL_HOST;
  const connectionString = resolvedUrl || process.env.DATABASE_URL!;

  // If we pre-resolved the hostname to an IP (for mobile hotspot DNS fix),
  // we need to set SSL servername to the original hostname so that:
  // 1. TLS SNI sends the correct hostname (Neon uses it for routing)
  // 2. Certificate verification matches the original hostname
  const poolConfig: import("pg").PoolConfig = {
    connectionString,
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    ...(resolvedUrl && originalHost
      ? {
          ssl: {
            servername: originalHost,
            rejectUnauthorized: true,
          },
        }
      : {}),
  };

  const adapter = new PrismaPg(poolConfig, {
    onPoolError: (err) => {
      console.error("Postgres pool error:", err.message);
    },
    onConnectionError: (err) => {
      console.error("Postgres connection error:", err.message);
    },
  });

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in ALL environments — the cron checker needs a stable singleton.
globalForPrisma.prisma = prisma;

export default prisma;
