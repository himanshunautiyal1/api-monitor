import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  monitorId: z.number().int(),
  destination: z.string().email(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { monitorId, destination } = parsed.data;

  // verify monitor belongs to this user
  const monitor = await prisma.monitor.findFirst({
    where: { id: monitorId, userId: Number(session.user?.id) },
  });

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  // check if alert config already exists for this monitor + destination
  const existing = await prisma.alertConfig.findFirst({
    where: { monitorId, destination },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Alert already configured for this monitor and email" },
      { status: 400 },
    );
  }

  const alertConfig = await prisma.alertConfig.create({
    data: {
      userId: Number(session.user?.id),
      monitorId,
      destination,
      channel: "email",
    },
  });

  return NextResponse.json(alertConfig, { status: 201 });
}
