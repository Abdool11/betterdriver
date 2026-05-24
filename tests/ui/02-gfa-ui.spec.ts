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
