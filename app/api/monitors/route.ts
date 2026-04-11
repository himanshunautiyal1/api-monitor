import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { z } from "zod";

const monitorSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  intervalMinutes: z
    .number()
    .int()
    .refine((v) => [1, 5, 15].includes(v)),
  method: z.string().refine((v) => ["GET", "POST", "HEAD"].includes(v)),
  headers: z.record(z.string(), z.string()).default({}),
  responseTimeThreshold: z.number().int().min(100).default(2000),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monitors = await prisma.monitor.findMany({
    where: { userId: Number(session.user?.id) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = monitorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const monitor = await prisma.monitor.create({
    data: {
      ...parsed.data,
      userId: Number(session.user?.id),
    },
  });

  return NextResponse.json(monitor, { status: 201 });
}
