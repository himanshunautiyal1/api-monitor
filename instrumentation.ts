export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fix DNS resolution on mobile hotspot.
    // Android/Termux ignores /etc/resolv.conf — it uses the carrier's
    // DNS resolver, which may fail to resolve certain hostnames (like
    // Neon's pooler endpoint). Override Node.js's dns.lookup() to use
    // Google DNS (8.8.8.8) as the primary resolver.
    const dns = await import("node:dns");
    const resolver = new dns.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);

    const origLookup = dns.lookup;

    (dns as any).lookup = function (
      hostname: string,
      optionsOrCallback: any,
      maybeCallback?: any,
    ) {
      const callback =
        typeof optionsOrCallback === "function"
          ? optionsOrCallback
          : maybeCallback;

      // Pass through for localhost, IP addresses, or if no callback
      if (
        !hostname ||
        !callback ||
        hostname === "localhost" ||
        /^[\d.]+$/.test(hostname) ||
        hostname.includes(":")
      ) {
        return origLookup(hostname, optionsOrCallback, maybeCallback);
      }

      // Use Google DNS to resolve
      resolver.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          // Fall back to system DNS if Google DNS fails
          return origLookup(hostname, optionsOrCallback, maybeCallback);
        }
        callback(null, addresses[0], 4);
      });
    };

    console.log("🌐 DNS override active (using Google DNS 8.8.8.8)");

    const { startChecker } = await import("./lib/checker/index");
    startChecker();
  }
}
