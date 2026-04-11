import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import Link from "next/link";
import AutoRefresh from "@/components/dashboard/AutoRefresh";

export const dynamic = "force-dynamic";

async function getDashboardData(userId: number) {
  const monitors = await prisma.monitor.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (monitors.length === 0) {
    return { monitors: [], stats: null };
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

  // get uptime % for each monitor (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const uptimeData = await Promise.all(
    monitors.map(async (monitor) => {
      const total = await prisma.checkHistory.count({
        where: { monitorId: monitor.id, checkedAt: { gte: oneDayAgo } },
      });
      const up = await prisma.checkHistory.count({
        where: {
          monitorId: monitor.id,
          status: "up",
          checkedAt: { gte: oneDayAgo },
        },
      });
      return total > 0 ? ((up / total) * 100).toFixed(1) : null;
    }),
  );

  // get active incidents
  const activeIncidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds }, isResolved: false },
    include: { monitor: true },
    orderBy: { startedAt: "desc" },
  });

  // get recent resolved incidents
  const recentIncidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds }, isResolved: true },
    include: { monitor: true },
    orderBy: { resolvedAt: "desc" },
    take: 5,
  });

  // calculate overall stats
  const totalMonitors = monitors.length;
  const upMonitors = latestChecks.filter((c) => c?.status === "up").length;
  const downMonitors = latestChecks.filter((c) => c?.status === "down").length;
  const noDataMonitors = latestChecks.filter((c) => !c).length;

  const validUptimes = uptimeData.filter((u) => u !== null).map(Number);
  const avgUptime =
    validUptimes.length > 0
      ? (validUptimes.reduce((a, b) => a + b, 0) / validUptimes.length).toFixed(
          1,
        )
      : null;

  return {
    monitors,
    latestChecks,
    uptimeData,
    activeIncidents,
    recentIncidents,
    stats: {
      totalMonitors,
      upMonitors,
      downMonitors,
      noDataMonitors,
      avgUptime,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const data = await getDashboardData(userId);

  if (!data.stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {session?.user?.name}
        </h1>
        <p className="text-gray-400 mb-8">
          Get started by adding your first monitor
        </p>
        <Link
          href="/monitors/new"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Add your first monitor
        </Link>
      </div>
    );
  }

  const {
    stats,
    monitors,
    latestChecks,
    uptimeData,
    activeIncidents,
    recentIncidents,
  } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-gray-400">Here&apos;s your monitoring overview</p>
        </div>
        <AutoRefresh />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Monitors</p>
          <p className="text-3xl font-bold text-white">{stats.totalMonitors}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Up</p>
          <p className="text-3xl font-bold text-green-400">
            {stats.upMonitors}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Down</p>
          <p className="text-3xl font-bold text-red-400">
            {stats.downMonitors}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Avg Uptime (24h)</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats.avgUptime ? `${stats.avgUptime}%` : "N/A"}
          </p>
        </div>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            🔴 Active Incidents ({activeIncidents.length})
          </h2>
          <div className="space-y-2">
            {activeIncidents.map((incident) => {
              const downtimeMinutes = Math.floor(
                (Date.now() - incident.startedAt.getTime()) / 60000,
              );
              return (
                <div
                  key={incident.id}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">
                      {incident.monitor.name}
                    </p>
                    <p className="text-red-400 text-sm">
                      Down for {downtimeMinutes} minutes
                    </p>
                  </div>
                  <span className="text-red-400 text-sm">
                    Since {new Date(incident.startedAt).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monitors Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">
            Monitors Overview
          </h2>
          <Link
            href="/monitors"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {monitors.map((monitor, index) => {
            const latestCheck = latestChecks[index];
            const uptime = uptimeData[index];
            const isUp = latestCheck?.status === "up" && monitor.isActive;
            const isDown = latestCheck?.status === "down" && monitor.isActive;
            const isPaused = !monitor.isActive;

            return (
              <div
                key={monitor.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPaused
                        ? "bg-yellow-400"
                        : isUp
                          ? "bg-green-400"
                          : isDown
                            ? "bg-red-400"
                            : "bg-gray-500"
                    }`}
                  />
                  <div>
                    <p className="text-white font-medium">{monitor.name}</p>
                    <p className="text-gray-500 text-xs truncate max-w-xs">
                      {monitor.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Response</p>
                    <p className="text-white">
                      {latestCheck?.responseTimeMs
                        ? `${latestCheck.responseTimeMs}ms`
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Uptime 24h</p>
                    <p className="text-white">{uptime ? `${uptime}%` : "—"}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isPaused
                        ? "bg-yellow-500/20 text-yellow-400"
                        : isUp
                          ? "bg-green-500/20 text-green-400"
                          : isDown
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {isPaused
                      ? "PAUSED"
                      : isUp
                        ? "UP"
                        : isDown
                          ? "DOWN"
                          : "No data"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">
            Recent Incidents
          </h2>
          <div className="space-y-2">
            {recentIncidents.map((incident) => {
              const downtimeMinutes = incident.resolvedAt
                ? Math.floor(
                    (incident.resolvedAt.getTime() -
                      incident.startedAt.getTime()) /
                      60000,
                  )
                : null;
              return (
                <div
                  key={incident.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">
                      {incident.monitor.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(incident.startedAt).toLocaleDateString()} —{" "}
                      {downtimeMinutes !== null
                        ? `${downtimeMinutes} min downtime`
                        : ""}
                    </p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    Resolved
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
