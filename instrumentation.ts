export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startChecker } = await import("./lib/checker/index");
    startChecker();
  }
}
