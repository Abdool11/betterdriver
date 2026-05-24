import { request } from "@playwright/test";

// Warm up all three dev servers before tests run so Next.js doesn't
// cold-compile pages mid-test causing navigation timeouts.
async function globalSetup() {
  const urls = [
    // TAG
    "http://localhost:3000",
    "http://localhost:3000/contact",
    "http://localhost:3000/admin/login",
    "http://localhost:3000/admin/enquiries",
    // GFA — hit twice to ensure compilation completes
    "http://localhost:3001",
    "http://localhost:3001/register",
    "http://localhost:3001/login",
    "http://localhost:3001/admin/login",
    "http://localhost:3001/admin/dashboard",
    "http://localhost:3001/programmes",
    "http://localhost:3001/login",       // second hit
    "http://localhost:3001/admin/login", // second hit
    // BD
    "http://localhost:3002",
    "http://localhost:3002/start",
    "http://localhost:3002/admin/login",
    "http://localhost:3002/portal",
  ];

  console.log("\n[global-setup] Warming up dev servers...");
  const ctx = await request.newContext({ ignoreHTTPSErrors: true });

  for (const url of urls) {
    try {
      const res = await ctx.get(url, { timeout: 30_000 });
      console.log(`  ✓ ${url} → ${res.status()}`);
    } catch (e: any) {
      console.warn(`  ✗ ${url} → ${e.message?.split("\n")[0]}`);
    }
  }

  await ctx.dispose();
  console.log("[global-setup] Warmup complete.\n");
}

export default globalSetup;
