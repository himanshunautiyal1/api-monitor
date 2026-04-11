import { Monitor } from "@/lib/generated/prisma/client";

export interface PingResult {
  status: "up" | "down";
  responseTimeMs: number;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function pingMonitor(monitor: Monitor): Promise<PingResult> {
  const startTime = Date.now();

  try {
    const headers = (monitor.headers as Record<string, string>) || {};

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(monitor.url, {
      method: monitor.method,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startTime;
    const isUp = response.status < 400;

    // check response time threshold
    const thresholdExceeded = responseTimeMs > monitor.responseTimeThreshold;

    return {
      status: isUp && !thresholdExceeded ? "up" : "down",
      responseTimeMs,
      statusCode: response.status,
      errorMessage: !isUp
        ? `HTTP ${response.status}`
        : thresholdExceeded
          ? `Response time ${responseTimeMs}ms exceeded threshold ${monitor.responseTimeThreshold}ms`
          : null,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return {
      status: "down",
      responseTimeMs,
      statusCode: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
