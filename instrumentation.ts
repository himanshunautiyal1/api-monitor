export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Pre-resolve Neon's hostname using Google DNS.
    // Android/Termux on mobile hotspot uses the carrier's DNS which
    // may fail to resolve Neon's hostname.
    try {
      const dns = await import("node:dns");
      const resolver = new dns.Resolver();
      resolver.setServers(["8.8.8.8", "1.1.1.1"]);

      // Extract hostname from DATABASE_URL using regex (not URL API,
      // because URL API doesn't handle postgresql:// correctly)
      const dbUrl = process.env.DATABASE_URL!;
      const hostMatch = dbUrl.match(/@([^/:?]+)/);

      if (hostMatch) {
        const originalHost = hostMatch[1];

        const addresses = await new Promise<string[]>((resolve, reject) => {
          resolver.resolve4(originalHost, (err, addrs) => {
            if (err) reject(err);
            else resolve(addrs);
          });
        });

        if (addresses.length > 0) {
          // Replace hostname with resolved IP in the connection string
          const resolvedUrl = dbUrl.replace(originalHost, addresses[0]);
          process.env._DB_RESOLVED_URL = resolvedUrl;
          process.env._DB_ORIGINAL_HOST = originalHost;
          console.log(`🌐 DNS: Resolved ${originalHost} → ${addresses[0]}`);
        }
      }
    } catch (err) {
      console.log("🌐 DNS pre-resolution skipped, using system DNS:", err);
    }

    const { startChecker } = await import("./lib/checker/index");
    startChecker();
  }
}
