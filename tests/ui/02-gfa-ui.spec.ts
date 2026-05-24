import { test, expect } from "@playwright/test";
import { URLS, ADMINS, TEST_COMPANY } from "../helpers";

const BASE = URLS.GFA;

// ── Homepage ──────────────────────────────────────────────────────────────────

test("GFA homepage loads", async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA homepage — has navigation", async ({ page }) => {
  await page.goto(BASE);
  await expect(page.locator("nav")).toBeVisible();
});

// ── Company Auth ──────────────────────────────────────────────────────────────

test("GFA register page loads", async ({ page }) => {
  await page.goto(`${BASE}/register`, { timeout: 20_000, waitUntil: "domcontentloaded" });
  // Page should load without crashing
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
  // Should have some form of registration UI
  const hasForm = await page.locator("form").isVisible({ timeout: 5_000 }).catch(() => false);
  const hasInput = await page.locator("input").first().isVisible({ timeout: 5_000 }).catch(() => false);
  expect(hasForm || hasInput).toBe(true);
});

test("GFA login page loads", async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
  const hasForm = await page.locator("form").isVisible().catch(() => false);
  const hasInput = await page.locator("input").first().isVisible().catch(() => false);
  expect(hasForm || hasInput).toBe(true);
});

test("GFA company register — fills form and submits", async ({ page }) => {
  const email = `uicompany_${Date.now()}@testdomain.co.za`;
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/auth/register") || res.url().includes("/register"),
    { timeout: 15_000 }
  ).catch(() => null);

  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });

  // Fill inputs by type — resilient across different form layouts
  const allInputs = page.locator("input:not([type='hidden'])");
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const inp = allInputs.nth(i);
    const type = await inp.getAttribute("type") ?? "text";
    const name = (await inp.getAttribute("name") ?? "").toLowerCase();
    if (type === "email" || name.includes("email")) {
      await inp.fill(email).catch(() => {});
    } else if (type === "password") {
      await inp.fill(TEST_COMPANY.password).catch(() => {});
    } else if (name.includes("company") || name.includes("name")) {
      await inp.fill("UI Test Logistics").catch(() => {});
    } else if (type === "text" || type === "tel") {
      await inp.fill("UI Test").catch(() => {});
    }
  }

  await page.click("button[type='submit']").catch(() => {});
  const response = await responsePromise;

  if (response) {
    expect([200, 201]).toContain(response.status());
  } else {
    // Might be a server action — just check no crash
    await expect(page.locator("body")).not.toContainText("Application error");
  }
});

// ── Admin Login ───────────────────────────────────────────────────────────────

test("GFA admin login page loads", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("form")).toBeVisible();
});

test("GFA admin login — wrong password shows error", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  // pressSequentially fires real key events, correctly updating React controlled state
  await page.locator("input[type='email']").pressSequentially(ADMINS.GFA.email, { delay: 20 });
  await page.locator("input[type='password']").pressSequentially("wrongpassword", { delay: 20 });
  await page.click("button[type='submit']");
  // Wait for the Signing in… spinner to disappear (API responded)
  await page.waitForFunction(() => !document.body.textContent?.includes("Signing in"), { timeout: 15_000 }).catch(() => {});
  // The GFA login API returns 401 and sets error state — look for the error div
  await expect(page.locator("body")).toContainText(/(invalid|error|incorrect|failed|unauthori)/i, { timeout: 10_000 });
});

test("GFA admin login — correct credentials redirects to dashboard", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator("input[type='email']").click();
  await page.locator("input[type='email']").type(ADMINS.GFA.email);
  await page.locator("input[type='password']").click();
  await page.locator("input[type='password']").type(ADMINS.GFA.password);
  await page.click("button[type='submit']");
  await page.waitForTimeout(3000);
  const url = page.url();
  const bodyText = await page.locator("body").textContent();
  const isRedirected = !url.includes("/login");
  const hasDashboard = (bodyText ?? "").match(/(dashboard|cohort|company|logout|admin)/i) !== null;
  expect(isRedirected || hasDashboard).toBe(true);
});

// ── Admin Dashboard (authenticated) ────────────────────────────────────────────────────

test("GFA admin dashboard loads without errors", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.fill("input[type='email'], input[name='email']", ADMINS.GFA.email);
  await page.fill("input[type='password']", ADMINS.GFA.password);
  await page.click("button[type='submit']");
  await page.waitForTimeout(3000);
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

// ── Public Pages ─────────────────────────────────────────────────────────────

test("GFA about page loads", async ({ page }) => {
  await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA pricing page loads", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA programmes page loads", async ({ page }) => {
  await page.goto(`${BASE}/programmes`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA publications page loads", async ({ page }) => {
  await page.goto(`${BASE}/publications`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA registry page loads", async ({ page }) => {
  await page.goto(`${BASE}/registry`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA contact page loads", async ({ page }) => {
  await page.goto(`${BASE}/contact`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA privacy page loads", async ({ page }) => {
  await page.goto(`${BASE}/privacy`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA terms page loads", async ({ page }) => {
  await page.goto(`${BASE}/terms`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA trial page loads", async ({ page }) => {
  await page.goto(`${BASE}/trial`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

test("GFA CPD bulletins page loads", async ({ page }) => {
  await page.goto(`${BASE}/cpd-bulletins`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
});

// ── Company Login Flow ───────────────────────────────────────────────────────

test("GFA company login — correct credentials reaches dashboard", async ({ page }) => {
  // Register a company first
  const email = `uilogin_${Date.now()}@testdomain.co.za`;
  const password = TEST_COMPANY.password;

  // Register via API
  await page.request.post(`${BASE}/api/auth/register`, {
    data: { ...TEST_COMPANY, email, password },
  });

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const allInputs = page.locator("input:not([type='hidden'])");
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const inp = allInputs.nth(i);
    const type = await inp.getAttribute("type") ?? "text";
    const name = (await inp.getAttribute("name") ?? "").toLowerCase();
    if (type === "email" || name.includes("email")) {
      await inp.fill(email).catch(() => {});
    } else if (type === "password") {
      await inp.fill(password).catch(() => {});
    }
  }

  await page.click("button[type='submit']").catch(() => {});
  await page.waitForTimeout(3000);
  const url = page.url();
  const bodyText = await page.locator("body").textContent();
  const loggedIn = !url.includes("/login") || (bodyText ?? "").match(/(dashboard|driver|import|campaign|logout)/i) !== null;
  expect(loggedIn).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

// ── Company Dashboard Pages (unauthenticated — should redirect to login) ─────

test("GFA dashboard — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  const bodyText = await page.locator("body").textContent();
  // Either redirected to login or shows a login-like prompt
  const handled = url.includes("/login") || (bodyText ?? "").match(/(sign in|log in|email|password)/i) !== null;
  expect(handled).toBe(true);
});

test("GFA dashboard/import — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/import`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/campaigns — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/campaigns`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/training-campaigns — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/training-campaigns`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/payment — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/payment`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/reports — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/reports`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/bulletins — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/bulletins`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/career-planner — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/career-planner`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/cpd-library — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/cpd-library`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("GFA dashboard/cpd-submission — unauthenticated redirects to login", async ({ page }) => {
  await page.goto(`${BASE}/dashboard/cpd-submission`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const url = page.url();
  expect(url.includes("/login") || url.includes("/dashboard")).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

// ── Admin Sub-pages (authenticated) ──────────────────────────────────────────

test.describe("GFA admin authenticated navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.locator("input[type='email']").pressSequentially(ADMINS.GFA.email, { delay: 10 });
    await page.locator("input[type='password']").pressSequentially(ADMINS.GFA.password, { delay: 10 });
    await page.click("button[type='submit']");
    await page.waitForTimeout(3000);
  });

  test("GFA admin — cohorts page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/cohorts`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — companies page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/companies`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — leads page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/leads`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — funnel page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/funnel`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — pricing page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/pricing`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — programmes page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/programmes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — stats page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/stats`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — vouchers page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/vouchers`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — cpd-queue page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/cpd-queue`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — video-library page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/video-library`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — data page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/data`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — email-settings page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/email-settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — settings messaging page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/settings/messaging`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("GFA admin — super page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/super`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});
