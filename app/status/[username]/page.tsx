import prisma from "@/lib/db";
import { notFound } from "next/navigation";

export const revalidate = 30;

export default async function StatusPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) notFound();

  const monitors = await prisma.monitor.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (monitors.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            {username}&apos;s Status Page
          </h1>
          <p className="text-white/60">No monitors configured yet</p>
        </div>
      </div>
    );
  }

  const monitorIds = monitors.map((m) => m.id);

  // get latest check for each monitor
  const latestChecks = await Promise.all(
    monitors.map((monitor) =>
      prisma.checkHistory.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
      }),
    ),
  );

  // get uptime % for each monitor (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const uptimeData = await Promise.all(
    monitors.map(async (monitor) => {
      const total = await prisma.checkHistory.count({
        where: { monitorId: monitor.id, checkedAt: { gte: sevenDaysAgo } },
      });
      const up = await prisma.checkHistory.count({
        where: {
          monitorId: monitor.id,
          status: "up",
          checkedAt: { gte: sevenDaysAgo },
        },
      });
      return total > 0 ? ((up / total) * 100).toFixed(2) : null;
    }),
  );

  // get active incidents
  const activeIncidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds }, isResolved: false },
  });

  const allUp = latestChecks.every((c) => c?.status === "up");
  const anyDown = latestChecks.some((c) => c?.status === "down");

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            {username}&apos;s API Status
          </h1>
          <p className="text-white/60 text-sm">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`rounded-xl p-5 mb-8 text-center ${
            anyDown
              ? "bg-red-500/10 border border-red-500/20"
              : "bg-green-500/10 border border-green-500/20"
          }`}
        >
          <p
            className={`text-lg font-semibold ${
              anyDown ? "text-red-400" : "text-green-400"
            }`}
          >
            {anyDown
              ? "⚠️ Some systems are experiencing issues"
              : "✅ All systems operational"}
          </p>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">
              Active Incidents
            </h2>
            <div className="space-y-2">
              {activeIncidents.map((incident) => {
                const monitor = monitors.find(
                  (m) => m.id === incident.monitorId,
                );
                const downtimeMinutes = Math.floor(
                  (Date.now() - incident.startedAt.getTime()) / 60000,
                );
                return (
                  <div
                    key={incident.id}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4"
                  >
                    <p className="text-white font-medium">{monitor?.name}</p>
                    <p className="text-red-400 text-sm mt-1">
                      Down for {downtimeMinutes} minutes — since{" "}
                      {new Date(incident.startedAt).toLocaleTimeString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Monitors List */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Services ({monitors.length})
          </h2>
          <div className="space-y-2">
            {monitors.map((monitor, index) => {
              const latestCheck = latestChecks[index];
              const uptime = uptimeData[index];
              const isUp = latestCheck?.status === "up";
              const isDown = latestCheck?.status === "down";

              return (
                <div
                  key={monitor.id}
                  className="bg-white/2 border border-white/6 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isUp
                          ? "bg-green-400"
                          : isDown
                            ? "bg-red-400 animate-pulse"
                            : "bg-gray-500"
                      }`}
                    />
                    <div>
                      <p className="text-white font-medium">{monitor.name}</p>
                      {monitor.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {monitor.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-white/4 text-white/60 px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-white/60 text-xs">Uptime 7d</p>
                      <p className="text-white">
                        {uptime ? `${uptime}%` : "—"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        isUp
                          ? "bg-green-500/20 text-green-400"
                          : isDown
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-700 text-white/60"
                      }`}
                    >
                      {isUp ? "Operational" : isDown ? "Down" : "No data"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm">
            Powered by{" "}
            <span className="text-white/45 font-medium">API Monitor</span>
          </p>
        </div>
      </div>
    </div>
  );
}
