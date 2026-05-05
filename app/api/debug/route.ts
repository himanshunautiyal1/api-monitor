import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Debug endpoint to test DB connectivity and checker functionality
// Access via: GET /api/debug
// Remove this file once the issue is resolved
export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Can we read from the DB?
  try {
    const monitorCount = await prisma.monitor.findMany({
      where: { isActive: true },
    });
    results.dbRead = {
      success: true,
      activeMonitors: monitorCount.length,
      monitors: monitorCount.map((m) => ({
        id: m.id,
        name: m.name,
        interval: m.intervalMinutes,
        threshold: m.responseTimeThreshold,
      })),
    };
  } catch (error) {
    results.dbRead = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 2: Can we write to the DB?
  try {
    // Only test if there's at least one monitor
    const firstMonitor = await prisma.monitor.findFirst({
      where: { isActive: true },
    });

    if (firstMonitor) {
      const testCheck = await prisma.checkHistory.create({
        data: {
          monitorId: firstMonitor.id,
          status: "up",
          responseTimeMs: 0,
          statusCode: 200,
          errorMessage: "DEBUG_TEST — safe to delete",
        },
      });
      results.dbWrite = {
        success: true,
        createdId: testCheck.id,
        monitorId: firstMonitor.id,
      };

      // Clean up the test record
      await prisma.checkHistory.delete({
        where: { id: testCheck.id },
      });
      results.dbWriteCleanup = { success: true };
    } else {
      results.dbWrite = { skipped: true, reason: "No active monitors found" };
    }
  } catch (error) {
    results.dbWrite = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Test 3: Check latest check_history entries
  try {
    const latestChecks = await prisma.checkHistory.findMany({
      orderBy: { checkedAt: "desc" },
      take: 5,
      include: { monitor: { select: { name: true } } },
    });
    results.latestChecks = {
      count: latestChecks.length,
      entries: latestChecks.map((c) => ({
        id: c.id,
        monitor: c.monitor.name,
        status: c.status,
        responseTimeMs: c.responseTimeMs,
        checkedAt: c.checkedAt.toISOString(),
        error: c.errorMessage,
      })),
    };
  } catch (error) {
    results.latestChecks = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test 4: Check cron timing
  const now = new Date();
  const minutesSinceEpoch = Math.floor(now.getTime() / 60000);
  results.cronTiming = {
    currentTime: now.toISOString(),
    minutesSinceEpoch,
    wouldRunInterval1: minutesSinceEpoch % 1 === 0,
    wouldRunInterval5: minutesSinceEpoch % 5 === 0,
    wouldRunInterval15: minutesSinceEpoch % 15 === 0,
  };

  // Test 5: Environment check
  results.environment = {
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasEmailHost: !!process.env.EMAIL_HOST,
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    nextRuntime: process.env.NEXT_RUNTIME,
  };

  return NextResponse.json(results, { status: 200 });
}
