import cron from "node-cron";
import prisma from "@/lib/db";
import { pingMonitor } from "./ping";
import { sendDownAlert, sendRecoveryAlert, sendWeeklySummary } from "./alerts";

let isRunning = false;

export function startChecker() {
  if (isRunning) return;
  isRunning = true;

  console.log("✅ Background checker started at", new Date().toISOString());

  // main checker — runs every minute
  cron.schedule("* * * * *", async () => {
    console.log("⏰ Cron tick at", new Date().toISOString());
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

  console.log(`🔍 runChecks: fetching active monitors...`);

  let monitors;
  try {
    monitors = await prisma.monitor.findMany({
      where: { isActive: true },
    });
    console.log(`🔍 runChecks: found ${monitors.length} active monitors`);
  } catch (error) {
    console.error("❌ runChecks: FAILED to fetch monitors from DB:", error);
    return;
  }

  if (monitors.length === 0) {
    console.log("🔍 runChecks: no active monitors, skipping");
    return;
  }

  // For each monitor, check if enough time has passed since its last check.
  // This is more resilient than the old modulo approach — if cron misses
  // several ticks (common on phone due to CPU throttling), the next
  // successful tick will still run overdue checks instead of skipping them.
  for (const monitor of monitors) {
    let shouldRun = false;

    try {
      const lastCheck = await prisma.checkHistory.findFirst({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: "desc" },
        select: { checkedAt: true },
      });

      if (!lastCheck) {
        // Never checked before — run immediately
        shouldRun = true;
      } else {
        const msSinceLastCheck = now.getTime() - lastCheck.checkedAt.getTime();
        const intervalMs = monitor.intervalMinutes * 60 * 1000;
        // Run if at least 90% of the interval has passed (small buffer to
        // avoid running twice in the same minute due to timing jitter)
        shouldRun = msSinceLastCheck >= intervalMs * 0.9;
      }
    } catch (error) {
      console.error(
        `❌ Failed to check last run time for ${monitor.name}:`,
        error,
      );
      // If we can't check, try running anyway
      shouldRun = true;
    }

    console.log(
      `🔍 Monitor "${monitor.name}" (interval=${monitor.intervalMinutes}m): ${shouldRun ? "WILL CHECK" : "skipping (not due yet)"}`,
    );

    if (!shouldRun) continue;

    try {
      await checkMonitor(monitor);
    } catch (err) {
      console.error(`❌ Error checking monitor ${monitor.name}:`, err);
    }
  }

  console.log("✅ runChecks: complete");
}

async function checkMonitor(
  monitor: Awaited<ReturnType<typeof prisma.monitor.findFirst>> & object,
) {
  console.log(`  📡 Pinging ${monitor.name} (${monitor.url})...`);

  let result;
  try {
    result = await pingMonitor(monitor as any);
    console.log(
      `  📡 Ping result: ${result.status} | ${result.responseTimeMs}ms | HTTP ${result.statusCode ?? "N/A"} | ${result.errorMessage ?? "OK"}`,
    );
  } catch (pingError) {
    console.error(`  ❌ Ping CRASHED for ${monitor.name}:`, pingError);
    return;
  }

  // save to check_history
  console.log(`  💾 Writing check to DB for ${monitor.name}...`);
  try {
    await prisma.checkHistory.create({
      data: {
        monitorId: monitor.id,
        status: result.status,
        responseTimeMs: result.responseTimeMs,
        statusCode: result.statusCode,
        errorMessage: result.errorMessage,
      },
    });
    console.log(`  ✅ DB write SUCCESS for ${monitor.name}`);
  } catch (dbError) {
    console.error(
      `  ❌ DB write FAILED for ${monitor.name}:`,
      dbError instanceof Error ? dbError.message : dbError,
    );
    console.error(`  ❌ Full error:`, dbError);
    return;
  }

  // get last check to detect status change
  const previousCheck = await prisma.checkHistory.findFirst({
    where: { monitorId: monitor.id },
    orderBy: { checkedAt: "desc" },
    skip: 1, // skip the one we just created
  });

  const statusChanged = previousCheck && previousCheck.status !== result.status;

  if (statusChanged) {
    console.log(
      `  🔄 Status changed: ${previousCheck.status} → ${result.status} for ${monitor.name}`,
    );

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
  } else {
    console.log(
      `  ℹ️ No status change for ${monitor.name} (was: ${previousCheck?.status ?? "none"}, now: ${result.status})`,
    );
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
