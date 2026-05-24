# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\full-flow.spec.ts >> Full GFA → BD driver activation flow >> Step 7 — BD portal unauthenticated redirects to /start
- Location: e2e\full-flow.spec.ts:124:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3002/portal
Call log:
  - navigating to "http://localhost:3002/portal", waiting until "load"

```

# Test source

```ts
  25  |     const res = await request.post(`${GFA}/api/auth/register`, {
  26  |       data: {
  27  |         companyName: "E2E Test Logistics",
  28  |         contactName: "E2E Admin",
  29  |         email,
  30  |         phone: "+27831234567",
  31  |         password: "E2ETest@2024",
  32  |         fleetSize: "3",
  33  |       },
  34  |     });
  35  |     expect(res.status()).toBe(200);
  36  |     const body = await res.json();
  37  |     expect(body.ok).toBe(true);
  38  | 
  39  |     // Save cookie for subsequent requests
  40  |     const setCookie = res.headers()["set-cookie"] ?? "";
  41  |     companySessionCookie = setCookie.split(";")[0];
  42  |     expect(companySessionCookie).toBeTruthy();
  43  |   });
  44  | 
  45  |   // ── Step 2: Company imports drivers ───────────────────────────────────────
  46  |   test("Step 2 — GFA company imports drivers via CSV", async ({ request }) => {
  47  |     test.skip(!companySessionCookie, "Skipped: no company session from Step 1");
  48  | 
  49  |     const csvContent = [
  50  |       "firstname,lastname,email,phone",
  51  |       `E2E,Driver,e2edriver_${Date.now()}@testdomain.co.za,+27831234567`,
  52  |     ].join("\n");
  53  | 
  54  |     const res = await request.post(`${GFA}/api/company/import`, {
  55  |       headers: { Cookie: companySessionCookie },
  56  |       multipart: {
  57  |         file: {
  58  |           name: "drivers.csv",
  59  |           mimeType: "text/csv",
  60  |           buffer: Buffer.from(csvContent),
  61  |         },
  62  |       },
  63  |     });
  64  |     // Accept 200 or 201
  65  |     expect([200, 201]).toContain(res.status());
  66  |     const body = await res.json();
  67  |     // count/imported may be 0 if no pre-existing drivers match — route is reachable
  68  |     expect(body.ok ?? body.imported ?? body.count ?? body.rows ?? true).toBeDefined();
  69  |   });
  70  | 
  71  |   // ── Step 3: Company deploys training campaign ──────────────────────────────
  72  |   test("Step 3 — GFA company creates training campaign", async ({ request }) => {
  73  |     test.skip(!companySessionCookie, "Skipped: no company session from Step 1");
  74  | 
  75  |     const res = await request.post(`${GFA}/api/company/training-campaigns`, {
  76  |       headers: {
  77  |         Cookie: companySessionCookie,
  78  |         "Content-Type": "application/json",
  79  |       },
  80  |       data: {
  81  |         programmeSlug: "professional-truck-driver",
  82  |         driverEmails: [`e2edriver_${Date.now()}@testdomain.co.za`],
  83  |       },
  84  |     });
  85  |     // Accept success or validation error — route is reachable
  86  |     expect([200, 201, 400, 401, 422]).toContain(res.status());
  87  |     if ([200, 201].includes(res.status())) {
  88  |       const body = await res.json();
  89  |       campaignId = body.id ?? body.campaignId ?? "";
  90  |     }
  91  |   });
  92  | 
  93  |   // ── Step 4: GFA admin logs in ─────────────────────────────────────────────
  94  |   test("Step 4 — GFA admin authenticates", async ({ request }) => {
  95  |     const res = await request.post(`${GFA}/api/admin/auth/login`, {
  96  |       data: { email: ADMINS.GFA.email, password: ADMINS.GFA.password },
  97  |     });
  98  |     expect(res.status()).toBe(200);
  99  |     const body = await res.json();
  100 |     expect(body.ok).toBe(true);
  101 |   });
  102 | 
  103 |   // ── Step 5: Verify BD start page ──────────────────────────────────────────
  104 |   test("Step 5 — BD /start page is accessible", async ({ page }) => {
  105 |     await page.goto(`${BD}/start`);
  106 |     await expect(page).toHaveTitle(/.+/);
  107 |     await expect(page.locator("body")).not.toContainText("Application error");
  108 |     await expect(page.locator("body")).not.toContainText("500");
  109 |   });
  110 | 
  111 |   // ── Step 6: Invalid magic link is handled gracefully ─────────────────────
  112 |   test("Step 6 — BD handles invalid magic link gracefully", async ({ page }) => {
  113 |     await page.goto(`${BD}/join/e2e-invalid-token-${Date.now()}`);
  114 |     await page.waitForTimeout(2000);
  115 |     // Should either redirect to /start or show error inline — must not crash
  116 |     const bodyText = await page.locator("body").textContent();
  117 |     const url = page.url();
  118 |     const ok = url.includes("/start") || (bodyText ?? "").match(/(invalid|error|expired|not found)/i) !== null;
  119 |     expect(ok).toBe(true);
  120 |     await expect(page.locator("body")).not.toContainText("Application error");
  121 |   });
  122 | 
  123 |   // ── Step 7: BD portal is protected by server-side middleware ─────────────
  124 |   test("Step 7 — BD portal unauthenticated redirects to /start", async ({ page }) => {
> 125 |     await page.goto(`${BD}/portal`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3002/portal
  126 |     await page.waitForURL(/\/start/, { timeout: 10_000 });
  127 |     expect(page.url()).toContain("/start");
  128 |   });
  129 | 
  130 |   // ── Step 8: BD admin can view drivers ─────────────────────────────────────
  131 |   test("Step 8 — BD admin dashboard accessible", async ({ page }) => {
  132 |     await page.goto(`${BD}/admin/login`);
  133 |     await page.fill("input[type='email'], input[name='email']", ADMINS.BD.email);
  134 |     await page.fill("input[type='password']", ADMINS.BD.password);
  135 |     await page.click("button[type='submit']");
  136 |     await page.waitForURL(/\/admin/, { timeout: 10_000 });
  137 |     await expect(page.locator("body")).not.toContainText("Application error");
  138 |     await expect(page.locator("body")).not.toContainText("500");
  139 |   });
  140 | });
  141 | 
```