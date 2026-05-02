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

  const latestChecks = await Promise.all(
    monitors.map((monitor) =>
      prisma.checkHistory.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
      }),
    ),
  );

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

  const activeIncidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds }, isResolved: false },
    include: { monitor: true },
    orderBy: { startedAt: "desc" },
  });

  const recentIncidents = await prisma.incident.findMany({
    where: { monitorId: { in: monitorIds }, isResolved: true },
    include: { monitor: true },
    orderBy: { resolvedAt: "desc" },
    take: 5,
  });

  const totalMonitors = monitors.length;
  const upMonitors = monitors.filter(
    (m, i) => m.isActive && latestChecks[i]?.status === "up",
  ).length;
  const downMonitors = monitors.filter(
    (m, i) => m.isActive && latestChecks[i]?.status === "down",
  ).length;
  const pausedMonitors = monitors.filter((m) => !m.isActive).length;

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
      pausedMonitors,
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
        <p className="text-white/60 mb-8">
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
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                stats.downMonitors > 0
                  ? "bg-red-400"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <h1
              className={`text-lg font-semibold ${
                stats.downMonitors > 0 ? "text-red-400" : "text-emerald-400"
              }`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {stats.downMonitors > 0
                ? `${stats.downMonitors} monitor${stats.downMonitors > 1 ? "s" : ""} down`
                : "All systems operational"}
            </h1>
          </div>
          <p
            className="text-white/45 text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {session?.user?.name} · {stats.totalMonitors} monitors
          </p>
        </div>
        <AutoRefresh />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Monitors",
            value: stats.totalMonitors,
            color: "text-white",
          },
          { label: "Up", value: stats.upMonitors, color: "text-emerald-400" },
          { label: "Down", value: stats.downMonitors, color: "text-red-400" },
          {
            label: "Paused",
            value: stats.pausedMonitors,
            color: "text-amber-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/2 border border-white/6 rounded-xl p-5"
          >
            <p
              className="text-white/30 text-xs mb-2 uppercase tracking-wider"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {s.label}
            </p>
            <p
              className={`text-4xl font-bold ${s.color}`}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontVariantNumeric: "tabular-nums",
                fontFeatureSettings: '"tnum", "zero"',
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
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
                    <Link
                      href={`/monitors/${incident.monitor.id}`}
                      className="text-white font-medium hover:text-white/50 transition-colors"
                    >
                      {incident.monitor.name}
                    </Link>
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
            className="text-white/50 hover:text-white/80 text-sm transition-colors underline underline-offset-2 decoration-white/20"
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
                className="bg-white/2 border border-white/6 rounded-xl p-4 flex items-center justify-between"
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
                    <Link
                      href={`/monitors/${monitor.id}`}
                      className="text-white font-medium hover:text-white/50 transition-colors"
                    >
                      {monitor.name}
                    </Link>
                    <p className="text-white/45 text-xs truncate max-w-xs">
                      {monitor.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-white/60 text-xs">Response</p>
                    <p className="text-white">
                      {latestCheck?.responseTimeMs
                        ? `${latestCheck.responseTimeMs}ms`
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs">Uptime 24h</p>
                    <p className="text-white">{uptime ? `${uptime}%` : "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isPaused
                          ? "bg-yellow-500/20 text-yellow-400"
                          : isUp
                            ? "bg-green-500/20 text-green-400"
                            : isDown
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-700 text-white/60"
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
                    <Link
                      href={`/monitors/${monitor.id}`}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      Details →
                    </Link>
                  </div>
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
                  className="bg-white/2 border border-white/6 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <Link
                      href={`/monitors/${incident.monitor.id}`}
                      className="text-white font-medium hover:text-white/50 transition-colors"
                    >
                      {incident.monitor.name}
                    </Link>
                    <p className="text-white/60 text-sm">
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
