import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  intervalMinutes: z
    .number()
    .int()
    .refine((v) => [1, 5, 15].includes(v))
    .optional(),
  method: z
    .string()
    .refine((v) => ["GET", "POST", "HEAD"].includes(v))
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
  responseTimeThreshold: z.number().int().min(100).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

async function getMonitorForUser(id: number, userId: number) {
  return prisma.monitor.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getMonitorForUser(Number(id), Number(session.user?.id));

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json(monitor);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getMonitorForUser(Number(id), Number(session.user?.id));

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }

  const updated = await prisma.monitor.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getMonitorForUser(Number(id), Number(session.user?.id));

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  await prisma.monitor.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true });
}
