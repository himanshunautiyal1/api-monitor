import cron from "node-cron";
import { prisma } from "../db";
import { pingMonitor } from "./ping";
import { sendDownAlert, sendRecoveryAlert } from "./alerts";

let isRunning = false;

export function startChecker() {
  if (isRunning) {
    console.log("[Checker] Already running — skipping duplicate start");
    return;
  }
  isRunning = true;
  console.log("[Checker] Background checker started");

  // Runs every minute — the per-monitor interval is handled inside
  cron.schedule("* * * * *", async () => {
    try {
      await runChecks();
    } catch (err) {
      // Top-level catch so cron NEVER silently dies
      console.error("[Checker] Unhandled error in runChecks:", err);
    }
  });
}

async function runChecks() {
  const now = new Date();
  const currentMinute = now.getMinutes();

  // Fetch only active monitors
  const monitors = await prisma.monitor.findMany({
    where: { isActive: true },
  });

  if (monitors.length === 0) return;

  // Run all checks in parallel (safe for small counts on phone RAM)
  await Promise.allSettled(
    monitors.map(async (monitor) => {
      try {
        // Respect the per-monitor interval
        if (currentMinute % monitor.intervalMinutes !== 0) return;

        await checkMonitor(monitor);
      } catch (err) {
        console.error(`[Checker] Error checking monitor ${monitor.id}:`, err);
      }
    }),
  );
}

async function checkMonitor(monitor: {
  id: string;
  userId: string;
  url: string;
  method: string;
  headers: unknown;
  responseTimeThreshold: number | null;
  isActive: boolean;
  intervalMinutes: number;
}) {
  const result = await pingMonitor(monitor);

  // ─── THE CRITICAL FIX: Explicit try/catch around EVERY DB write ───────────
  // Prisma 7 silent failures were causing check_history to never be written.
  // ─────────────────────────────────────────────────────────────────────────
  let savedCheck: {
    id: string;
    status: string;
    responseTimeMs: number | null;
  } | null = null;
  try {
    savedCheck = await prisma.checkHistory.create({
      data: {
        monitorId: monitor.id,
        status: result.status, // "up" | "down" | "timeout"
        responseTimeMs: result.responseTimeMs ?? null,
        statusCode: result.statusCode ?? null,
        errorMessage: result.errorMessage ?? null,
        checkedAt: new Date(),
      },
      select: { id: true, status: true, responseTimeMs: true },
    });
    console.log(
      `[Checker] ✓ check_history saved for ${monitor.url} → ${result.status} (${result.responseTimeMs ?? "n/a"}ms)`,
    );
  } catch (dbErr) {
    console.error(
      `[Checker] ✗ DB write FAILED for monitor ${monitor.id}:`,
      dbErr,
    );
    // Still proceed with alert logic using in-memory result
  }

  // Determine effective status (threshold check)
  const effectiveStatus = determineEffectiveStatus(
    result,
    monitor.responseTimeThreshold,
  );

  // Fetch last check (before this one) to detect transitions
  const previousCheck = await prisma.checkHistory
    .findFirst({
      where: {
        monitorId: monitor.id,
        // Exclude the one we just inserted
        ...(savedCheck ? { NOT: { id: savedCheck.id } } : {}),
      },
      orderBy: { checkedAt: "desc" },
      select: { status: true },
    })
    .catch(() => null);

  const previousStatus = previousCheck?.status ?? "up"; // Assume up on first ever check

  // ── Transition: up → down ────────────────────────────────────────────────
  if (effectiveStatus === "down" && previousStatus !== "down") {
    console.log(`[Checker] ALERT: ${monitor.url} went DOWN`);

    // Open a new incident
    await prisma.incident
      .create({
        data: {
          monitorId: monitor.id,
          startedAt: new Date(),
          isResolved: false,
        },
      })
      .catch((err) =>
        console.error("[Checker] Failed to create incident:", err),
      );

    // Send email — errors here must NOT crash the checker
    await sendDownAlert(monitor.id, monitor.url, result).catch((err) =>
      console.error("[Checker] Down alert email failed:", err),
    );
  }

  // ── Transition: down → up ────────────────────────────────────────────────
  if (effectiveStatus === "up" && previousStatus === "down") {
    console.log(`[Checker] RECOVERY: ${monitor.url} is back UP`);

    // Resolve open incidents
    await prisma.incident
      .updateMany({
        where: { monitorId: monitor.id, isResolved: false },
        data: { resolvedAt: new Date(), isResolved: true },
      })
      .catch((err) =>
        console.error("[Checker] Failed to resolve incident:", err),
      );

    // Send recovery email
    await sendRecoveryAlert(monitor.id, monitor.url, result).catch((err) =>
      console.error("[Checker] Recovery alert email failed:", err),
    );
  }
}

function determineEffectiveStatus(
  result: { status: string; responseTimeMs?: number | null },
  threshold: number | null,
): "up" | "down" {
  if (result.status !== "up") return "down";

  // Threshold check: even a 200 OK is "down" if it's too slow
  if (
    threshold != null &&
    threshold > 0 &&
    result.responseTimeMs != null &&
    result.responseTimeMs > threshold
  ) {
    console.log(
      `[Checker] Threshold exceeded: ${result.responseTimeMs}ms > ${threshold}ms`,
    );
    return "down";
  }

  return "up";
}
