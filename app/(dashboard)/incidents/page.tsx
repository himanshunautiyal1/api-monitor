import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import IncidentsList from "@/components/incidents/IncidentsList";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const monitors = await prisma.monitor.findMany({
    where: { userId },
    select: { id: true },
  });

  const monitorIds = monitors.map((m) => m.id);

  const incidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds } },
    include: { monitor: true },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  const totalCount = await prisma.incident.count({
    where: { monitorId: { in: monitorIds } },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Incidents</h1>
        <p className="text-gray-400 mt-1">
          History of all downtime events across your monitors
        </p>
      </div>
      <IncidentsList
        initialIncidents={incidents.map((i) => ({
          id: i.id,
          monitorId: i.monitorId,
          monitorName: i.monitor.name,
          monitorUrl: i.monitor.url,
          startedAt: i.startedAt.toISOString(),
          resolvedAt: i.resolvedAt?.toISOString() ?? null,
          isResolved: i.isResolved,
        }))}
        totalCount={totalCount}
        monitorIds={monitorIds}
      />
    </div>
  );
}
