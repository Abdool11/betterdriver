import { test, expect } from "@playwright/test";
import { URLS, ADMINS } from "../helpers";

const BASE = URLS.BD;

// ── Public Pages ──────────────────────────────────────────────────────────────

test("BD /start page loads", async ({ page }) => {
  await page.goto(`${BASE}/start`);
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("BD /start — shows error for missing token", async ({ page }) => {
  await page.goto(`${BASE}/start?error=missing-token`);
  await expect(page.locator("body")).toContainText(/(token|link|error|invalid)/i);
});

test("BD /start — shows error for invalid link", async ({ page }) => {
  await page.goto(`${BASE}/start?error=invalid-link`);
  await expect(page.locator("body")).toContainText(/(invalid|error|link)/i);
});

test("BD /start — shows error for expired link", async ({ page }) => {
  await page.goto(`${BASE}/start?error=link-expired`);
  await expect(page.locator("body")).toContainText(/(expired|error)/i);
});

// ── Magic Link Redirect ────────────────────────────────────────────────────────

test("BD /join/invalid — redirects to /start with error", async ({ page }) => {
  await page.goto(`${BASE}/join/this-is-not-a-valid-token`);
  await page.waitForTimeout(2000);
  // Should land on /start (with error param) or show error content
  const url = page.url();
  const bodyText = await page.locator("body").textContent();
  const landedOnStart = url.includes("/start");
  const showsError = (bodyText ?? "").match(/(invalid|error|expired|link)/i) !== null;
  expect(landedOnStart || showsError).toBe(true);
  await expect(page.locator("body")).not.toContainText("Application error");
});

// ── Portal (unauthenticated) ───────────────────────────────────────────────────

test("BD /portal — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/language — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/language`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/welcome — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/welcome`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

// ── Admin Login ───────────────────────────────────────────────────────────────

test("BD admin login page loads", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await expect(page.locator("form")).toBeVisible();
  await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("BD admin login — wrong password shows error", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", ADMINS.BD.email);
  await page.fill("input[type='password']", "wrongpassword");
  await page.click("button[type='submit']");
  // Wait for the loading state to clear, then check for error
  await page.waitForFunction(() => !document.body.textContent?.includes("Signing in"), { timeout: 8_000 }).catch(() => {});
  await expect(page.locator("body")).toContainText(/(invalid|error|incorrect)/i, { timeout: 8_000 });
});

test("BD admin login — correct credentials redirects to dashboard", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", ADMINS.BD.email);
  await page.fill("input[type='password']", ADMINS.BD.password);
  await page.click("button[type='submit']");
  await page.waitForTimeout(3000);
  const url = page.url();
  const bodyText = await page.locator("body").textContent();
  const isRedirected = !url.includes("/login");
  const hasDashboard = (bodyText ?? "").match(/(dashboard|driver|logout|admin)/i) !== null;
  expect(isRedirected || hasDashboard).toBe(true);
});

// ── Admin Dashboard ───────────────────────────────────────────────────────────

test("BD admin dashboard loads without errors", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", ADMINS.BD.email);
  await page.fill("input[type='password']", ADMINS.BD.password);
  await page.click("button[type='submit']");
  await page.waitForTimeout(3000);
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

// ── Additional Public Pages ──────────────────────────────────────────────────

test("BD homepage loads", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("BD /activate page loads", async ({ page }) => {
  await page.goto(`${BASE}/activate`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("BD /login page loads", async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("BD /help page loads", async ({ page }) => {
  await page.goto(`${BASE}/help`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("BD /registry page loads", async ({ page }) => {
  await page.goto(`${BASE}/registry`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});

test("BD /start — shows error for deactivated link", async ({ page }) => {
  await page.goto(`${BASE}/start?error=link-deactivated`);
  await expect(page.locator("body")).toContainText(/(deactivated|revoked|error|link)/i);
});

// ── Portal Sub-pages (unauthenticated — should redirect to /start) ──────────

test("BD /portal/profile — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/profile`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/course — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/course`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/learning — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/learning`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/progress — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/progress`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/certificate — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/certificate`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/cv — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/cv`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/tasks — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/tasks`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/setup — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/setup`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/support — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/support`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/cpd — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/cpd`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

test("BD /portal/bulletins — unauthenticated redirects to /start", async ({ page }) => {
  await page.goto(`${BASE}/portal/bulletins`);
  await page.waitForURL(/\/start/, { timeout: 10_000 });
  expect(page.url()).toContain("/start");
});

// ── Admin Authenticated Sub-pages ────────────────────────────────────────────

test.describe("BD admin authenticated navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.locator("input[type='email']").pressSequentially(ADMINS.BD.email, { delay: 10 });
    await page.locator("input[type='password']").pressSequentially(ADMINS.BD.password, { delay: 10 });
    await page.click("button[type='submit']");
    await page.waitForTimeout(3000);
  });

  test("BD admin — settings page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });

  test("BD admin — dashboard page loads after login", async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
  });
});
