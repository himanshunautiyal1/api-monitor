import cron from "node-cron";
import prisma from "@/lib/db";
import { pingMonitor } from "./ping";
import { sendDownAlert, sendRecoveryAlert, sendWeeklySummary } from "./alerts";

let isRunning = false;

export function startChecker() {
  if (isRunning) return;
  isRunning = true;

  console.log("✅ Background checker started");

  // main checker — runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      await runChecks();
    } catch (error) {
      console.error("Checker error:", error);
    }
  });

  // data retention — runs every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      await cleanOldData();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  // weekly summary — runs every monday at 9am
  cron.schedule("0 9 * * 1", async () => {
    try {
      await sendWeeklySummary();
    } catch (error) {
      console.error("Weekly summary error:", error);
    }
  });
}

async function runChecks() {
  const now = new Date();

  const monitors = await prisma.monitor.findMany({
    where: { isActive: true },
  });

  for (const monitor of monitors) {
    // check if it's time to ping this monitor
    const minutesSinceEpoch = Math.floor(now.getTime() / 60000);
    if (minutesSinceEpoch % monitor.intervalMinutes !== 0) continue;

    // run ping in background — don't await so monitors run in parallel
    checkMonitor(monitor).catch((err) =>
      console.error(`Error checking monitor ${monitor.id}:`, err),
    );
  }
}

async function checkMonitor(
  monitor: Awaited<ReturnType<typeof prisma.monitor.findFirst>> & object,
) {
  const result = await pingMonitor(monitor as any);

  // save to check_history
  await prisma.checkHistory.create({
    data: {
      monitorId: monitor.id,
      status: result.status,
      responseTimeMs: result.responseTimeMs,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
    },
  });

  // get last check to detect status change
  const previousCheck = await prisma.checkHistory.findFirst({
    where: { monitorId: monitor.id },
    orderBy: { checkedAt: "desc" },
    skip: 1, // skip the one we just created
  });

  const statusChanged = previousCheck && previousCheck.status !== result.status;

  if (statusChanged) {
    if (result.status === "down") {
      // create incident
      await prisma.incident.create({
        data: { monitorId: monitor.id },
      });

      // send down alert
      await sendDownAlert(
        monitor.id,
        monitor.name,
        monitor.url,
        result.errorMessage,
      );
    } else {
      // resolve active incident
      const activeIncident = await prisma.incident.findFirst({
        where: { monitorId: monitor.id, isResolved: false },
      });

      if (activeIncident) {
        const downtimeMinutes = Math.floor(
          (Date.now() - activeIncident.startedAt.getTime()) / 60000,
        );

        await prisma.incident.update({
          where: { id: activeIncident.id },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
          },
        });

        await sendRecoveryAlert(
          monitor.id,
          monitor.name,
          monitor.url,
          downtimeMinutes,
        );
      }
    }
  }
}

async function cleanOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.checkHistory.deleteMany({
    where: { checkedAt: { lt: thirtyDaysAgo } },
  });

  console.log(`🧹 Cleaned ${deleted.count} old check history records`);
}
