import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg(
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

  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache in ALL environments — the cron checker needs a stable singleton.
globalForPrisma.prisma = prisma;

export default prisma;
