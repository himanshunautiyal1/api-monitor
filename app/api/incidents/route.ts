import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const skip = Number(searchParams.get("skip") ?? 0);
  const monitorIdsParam = searchParams.get("monitorIds");

  if (!monitorIdsParam) {
    return NextResponse.json({ error: "monitorIds required" }, { status: 400 });
  }

  const monitorIds = monitorIdsParam.split(",").map(Number);

  // verify these monitors belong to the logged in user
  const userMonitors = await prisma.monitor.findMany({
    where: {
      id: { in: monitorIds },
      userId: Number(session.user?.id),
    },
    select: { id: true },
  });

  const validMonitorIds = userMonitors.map((m) => m.id);

  const incidents = await prisma.incident.findMany({
    where: { monitorId: { in: validMonitorIds } },
    include: { monitor: true },
    orderBy: { startedAt: "desc" },
    skip,
    take: 10,
  });

  return NextResponse.json(
    incidents.map((i) => ({
      id: i.id,
      monitorId: i.monitorId,
      monitorName: i.monitor.name,
      monitorUrl: i.monitor.url,
      startedAt: i.startedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
      isResolved: i.isResolved,
    })),
  );
}
