import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const resolvedUrl = process.env._DB_RESOLVED_URL;
  const originalHost = process.env._DB_ORIGINAL_HOST;

  let adapter: PrismaPg;

  if (resolvedUrl && originalHost) {
    // Mobile hotspot DNS fix: connect via pre-resolved IP, but set
    // SSL servername to the original hostname so TLS SNI works
    // (Neon uses SNI to route to the correct database endpoint)
    const pool = new pg.Pool({
      connectionString: resolvedUrl,
      ssl: {
        servername: originalHost,
        rejectUnauthorized: true,
      },
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error("Postgres pool error:", err.message);
    });

    adapter = new PrismaPg(pool);
  } else {
    // Standard path: use DATABASE_URL directly (system DNS works)
    adapter = new PrismaPg(
      {
        connectionString: process.env.DATABASE_URL!,
        max: 5,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 10000,
      },
      {
        onPoolError: (err) => {
          console.error("Postgres pool error:", err.message);
        },
        onConnectionError: (err) => {
          console.error("Postgres connection error:", err.message);
        },
      },
    );
  }

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in ALL environments — the cron checker needs a stable singleton.
globalForPrisma.prisma = prisma;

export default prisma;
