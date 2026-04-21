import { auth } from "@/lib/auth/config";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import ResponseTimeChart from "@/components/charts/ResponseTimeChart";
import UptimeChart from "@/components/charts/UptimeChart";

export const dynamic = "force-dynamic";

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const monitor = await prisma.monitor.findFirst({
    where: {
      id: Number(id),
      userId: Number(session?.user?.id),
    },
  });

  if (!monitor) notFound();

  // last 24h response time data
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const responseTimeData = await prisma.checkHistory.findMany({
    where: {
      monitorId: monitor.id,
      checkedAt: { gte: oneDayAgo },
    },
    orderBy: { checkedAt: "asc" },
    select: {
      checkedAt: true,
      responseTimeMs: true,
      status: true,
    },
  });

  // last 7 days uptime data
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyChecks = await prisma.checkHistory.findMany({
    where: {
      monitorId: monitor.id,
      checkedAt: { gte: sevenDaysAgo },
    },
    orderBy: { checkedAt: "asc" },
    select: {
      checkedAt: true,
      status: true,
    },
  });

  // group weekly checks by day
  const dailyUptime = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(date.getDate() + i);
    const dayStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const dayChecks = weeklyChecks.filter((c) => {
      const checkDate = new Date(c.checkedAt);
      return checkDate.toDateString() === date.toDateString();
    });

    const total = dayChecks.length;
    const up = dayChecks.filter((c) => c.status === "up").length;
    const uptime = total > 0 ? Math.round((up / total) * 100) : null;

    return { day: dayStr, uptime };
  });

  // latest check
  const latestCheck = await prisma.checkHistory.findFirst({
    where: { monitorId: monitor.id },
    orderBy: { checkedAt: "desc" },
  });

  // active incident
  const activeIncident = await prisma.incident.findFirst({
    where: { monitorId: monitor.id, isResolved: false },
  });

  // overall stats
  const totalChecks = await prisma.checkHistory.count({
    where: { monitorId: monitor.id, checkedAt: { gte: sevenDaysAgo } },
  });
  const upChecks = await prisma.checkHistory.count({
    where: {
      monitorId: monitor.id,
      status: "up",
      checkedAt: { gte: sevenDaysAgo },
    },
  });
  const uptime7d =
    totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) : null;

  const avgResponseTime = await prisma.checkHistory.aggregate({
    where: {
      monitorId: monitor.id,
      checkedAt: { gte: oneDayAgo },
      status: "up",
    },
    _avg: { responseTimeMs: true },
  });

  const isUp = latestCheck?.status === "up" && monitor.isActive;
  const isDown = latestCheck?.status === "down" && monitor.isActive;
  const isPaused = !monitor.isActive;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-3 h-3 rounded-full ${
                isPaused
                  ? "bg-yellow-400"
                  : isUp
                    ? "bg-green-400"
                    : isDown
                      ? "bg-red-400 animate-pulse"
                      : "bg-gray-500"
              }`}
            />
            <h1 className="text-2xl font-bold text-white">{monitor.name}</h1>
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
              {isPaused ? "PAUSED" : isUp ? "UP" : isDown ? "DOWN" : "No data"}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{monitor.url}</p>
          {latestCheck && (
            <p className="text-gray-500 text-xs mt-1">
              Last checked: {new Date(latestCheck.checkedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Active Incident Banner */}
      {activeIncident && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 font-medium">⚠️ Active Incident</p>
          <p className="text-gray-400 text-sm mt-1">
            Down since {new Date(activeIncident.startedAt).toLocaleString()} (
            {Math.floor(
              (Date.now() - activeIncident.startedAt.getTime()) / 60000,
            )}{" "}
            minutes)
          </p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Uptime (7d)</p>
          <p className="text-2xl font-bold text-white">
            {uptime7d ? `${uptime7d}%` : "—"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Avg Response (24h)</p>
          <p className="text-2xl font-bold text-white">
            {avgResponseTime._avg.responseTimeMs
              ? `${Math.round(avgResponseTime._avg.responseTimeMs)}ms`
              : "—"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Checks (7d)</p>
          <p className="text-2xl font-bold text-white">{totalChecks}</p>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          Response Time (last 24h)
        </h2>
        <ResponseTimeChart
          data={responseTimeData.map((c) => ({
            time: new Date(c.checkedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            responseTime: c.responseTimeMs ?? 0,
            status: c.status,
          }))}
        />
      </div>

      {/* Uptime Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">
          Daily Uptime (last 7 days)
        </h2>
        <UptimeChart data={dailyUptime} />
      </div>

      {/* Monitor Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Monitor Configuration
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Method</p>
            <p className="text-white mt-1">{monitor.method}</p>
          </div>
          <div>
            <p className="text-gray-400">Check Interval</p>
            <p className="text-white mt-1">
              Every {monitor.intervalMinutes} minute(s)
            </p>
          </div>
          <div>
            <p className="text-gray-400">Response Threshold</p>
            <p className="text-white mt-1">{monitor.responseTimeThreshold}ms</p>
          </div>
          <div>
            <p className="text-gray-400">Tags</p>
            <p className="text-white mt-1">
              {monitor.tags.length > 0 ? monitor.tags.join(", ") : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
