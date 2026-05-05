export interface PingResult {
  status: "up" | "down" | "timeout";
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

interface MonitorConfig {
  url: string;
  method: string;
  headers: unknown;
  responseTimeThreshold?: number | null;
}

export async function pingMonitor(monitor: MonitorConfig): Promise<PingResult> {
  const start = Date.now();

  // Parse custom headers safely
  let customHeaders: Record<string, string> = {};
  try {
    if (monitor.headers && typeof monitor.headers === "object") {
      customHeaders = monitor.headers as Record<string, string>;
    } else if (typeof monitor.headers === "string" && monitor.headers.trim()) {
      customHeaders = JSON.parse(monitor.headers);
    }
  } catch {
    // Invalid headers — ignore and proceed without them
  }

  // ── THE CRITICAL FIX: AbortController timeout ─────────────────────────────
  // Without a timeout, fetch on Termux can hang indefinitely when an API is
  // unreachable, blocking the entire cron tick and making ALL monitors stop.
  // ─────────────────────────────────────────────────────────────────────────
  const TIMEOUT_MS = 15_000; // 15 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(monitor.url, {
      method: monitor.method ?? "GET",
      headers: {
        "User-Agent": "api-monitor/1.0",
        ...customHeaders,
      },
      signal: controller.signal,
      // Do NOT follow redirects silently — treat 3xx as up
      redirect: "follow",
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - start;

    // Treat 2xx and 3xx as "up", everything else as "down"
    const isUp = response.status >= 200 && response.status < 400;

    return {
      status: isUp ? "up" : "down",
      responseTimeMs,
      statusCode: response.status,
      errorMessage: isUp ? null : `HTTP ${response.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - start;

    const isAbort = err instanceof Error && err.name === "AbortError";

    return {
      status: isAbort ? "timeout" : "down",
      responseTimeMs: isAbort ? TIMEOUT_MS : responseTimeMs,
      statusCode: null,
      errorMessage: isAbort
        ? `Timed out after ${TIMEOUT_MS / 1000}s`
        : err instanceof Error
          ? err.message
          : "Unknown error",
    };
  }
}
