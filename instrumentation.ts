export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fix DNS on mobile hotspot: Android's DNS resolver fails for
    // some hostnames. Patch Node's dns.lookup to use Google DNS.
    //
    // We use createRequire to get a mutable CJS reference — the ESM
    // import returns a readonly module namespace (which caused the
    // "Cannot set property lookup" error).
    try {
      const { createRequire } = await import("node:module");
      const cjsRequire = createRequire(`file://${process.cwd()}/`);
      const dns = cjsRequire("dns");

      const resolver = new dns.Resolver();
      resolver.setServers(["8.8.8.8", "1.1.1.1"]);

      const origLookup = dns.lookup;

      dns.lookup = function (
        hostname: string,
        optionsOrCallback: any,
        maybeCallback?: any,
      ) {
        const callback =
          typeof optionsOrCallback === "function"
            ? optionsOrCallback
            : maybeCallback;

        // Pass through for localhost, IPs, or missing callback
        if (
          !hostname ||
          !callback ||
          hostname === "localhost" ||
          /^[\d.]+$/.test(hostname) ||
          hostname.includes(":")
        ) {
          return origLookup.call(dns, hostname, optionsOrCallback, maybeCallback);
        }

        // Resolve via Google DNS, fall back to system DNS on error
        resolver.resolve4(hostname, (err: Error | null, addresses: string[]) => {
          if (err || !addresses || addresses.length === 0) {
            return origLookup.call(dns, hostname, optionsOrCallback, maybeCallback);
          }
          callback(null, addresses[0], 4);
        });
      };

      console.log("🌐 DNS override active (Google DNS 8.8.8.8)");
    } catch (err) {
      console.log("🌐 DNS override failed, using system DNS:", err);
    }

    const { startChecker } = await import("./lib/checker/index");
    startChecker();
  }
}
