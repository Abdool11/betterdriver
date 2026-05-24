import { request } from "@playwright/test";

// Warm up all three dev servers before tests run so Next.js doesn't
// cold-compile pages mid-test causing navigation timeouts.
async function globalSetup() {
  const urls = [
    // TAG — public pages
    "http://localhost:3000",
    "http://localhost:3000/contact",
    "http://localhost:3000/about",
    "http://localhost:3000/academy",
    "http://localhost:3000/books",
    "http://localhost:3000/ecosystem-partners",
    "http://localhost:3000/electric-truck",
    "http://localhost:3000/green-freight",
    "http://localhost:3000/knowledge-hub",
    "http://localhost:3000/services",
    "http://localhost:3000/tco-calculator",
    // TAG — admin pages
    "http://localhost:3000/admin/login",
    "http://localhost:3000/admin/enquiries",
    "http://localhost:3000/admin/companies",
    "http://localhost:3000/admin/pricing",
    "http://localhost:3000/admin/stats",
    // GFA — public pages
    "http://localhost:3001",
    "http://localhost:3001/register",
    "http://localhost:3001/login",
    "http://localhost:3001/about",
    "http://localhost:3001/pricing",
    "http://localhost:3001/programmes",
    "http://localhost:3001/publications",
    "http://localhost:3001/registry",
    "http://localhost:3001/contact",
    "http://localhost:3001/privacy",
    "http://localhost:3001/terms",
    "http://localhost:3001/trial",
    "http://localhost:3001/cpd-bulletins",
    // GFA — admin pages
    "http://localhost:3001/admin/login",
    "http://localhost:3001/admin/dashboard",
    "http://localhost:3001/admin/cohorts",
    "http://localhost:3001/admin/companies",
    "http://localhost:3001/admin/leads",
    "http://localhost:3001/admin/pricing",
    "http://localhost:3001/admin/stats",
    // GFA — second hit for critical pages
    "http://localhost:3001/login",
    "http://localhost:3001/admin/login",
    // BD — public pages
    "http://localhost:3002",
    "http://localhost:3002/start",
    "http://localhost:3002/activate",
    "http://localhost:3002/login",
    "http://localhost:3002/help",
    "http://localhost:3002/registry",
    // BD — admin pages
    "http://localhost:3002/admin/login",
    "http://localhost:3002/admin/dashboard",
    // BD — portal pages (will redirect to /start)
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
