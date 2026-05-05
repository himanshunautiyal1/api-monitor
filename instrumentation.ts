export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Pre-resolve Neon's hostname using Google DNS.
    // Android/Termux on mobile hotspot uses the carrier's DNS which
    // may fail to resolve Neon's hostname. We resolve it once at
    // startup and store the IP for the DB connection to use.
    try {
      const dns = await import("node:dns");
      const resolver = new dns.Resolver();
      resolver.setServers(["8.8.8.8", "1.1.1.1"]);

      const dbUrl = new URL(process.env.DATABASE_URL!);
      const originalHost = dbUrl.hostname;

      const addresses = await new Promise<string[]>((resolve, reject) => {
        resolver.resolve4(originalHost, (err, addrs) => {
          if (err) reject(err);
          else resolve(addrs);
        });
      });

      if (addresses.length > 0) {
        dbUrl.hostname = addresses[0];
        process.env._DB_RESOLVED_URL = dbUrl.toString();
        process.env._DB_ORIGINAL_HOST = originalHost;
        console.log(`🌐 DNS: Resolved ${originalHost} → ${addresses[0]}`);
      }
    } catch (err) {
      console.log("🌐 DNS pre-resolution skipped, using system DNS:", err);
    }

    const { startChecker } = await import("./lib/checker/index");
    startChecker();
  }
}
