import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const alertConfig = await prisma.alertConfig.findFirst({
    where: { id: Number(id), userId: Number(session.user?.id) },
  });

  if (!alertConfig) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updated = await prisma.alertConfig.update({
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

  const alertConfig = await prisma.alertConfig.findFirst({
    where: { id: Number(id), userId: Number(session.user?.id) },
  });

  if (!alertConfig) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alertConfig.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ success: true });
}
