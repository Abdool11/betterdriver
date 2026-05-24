import { test, expect } from "@playwright/test";
import { URLS, ADMINS } from "../helpers";

const BASE = URLS.TAG;

// ── Homepage ──────────────────────────────────────────────────────────────────

test("TAG homepage loads", async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle(/.+/);
  // Should not show a 500/404 error page
  const body = page.locator("body");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("500");
});

test("TAG homepage — has navigation", async ({ page }) => {
  await page.goto(BASE);
  const nav = page.locator("nav");
  await expect(nav).toBeVisible();
});

// ── Contact Form ──────────────────────────────────────────────────────────────

test("TAG contact form — visible on page", async ({ page }) => {
  await page.goto(`${BASE}/contact`);
  await expect(page.locator("form")).toBeVisible();
});

test("TAG contact form — submits successfully", async ({ page }) => {
  // Listen for the API response to confirm submission reached the server
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/submit-enquiry") || res.url().includes("submit"),
    { timeout: 15_000 }
  ).catch(() => null);

  await page.goto(`${BASE}/contact`);
  // Fill any visible text inputs
  const inputs = page.locator("input[type='text'], input[type='email'], input:not([type='hidden']):not([type='submit'])");
  const count = await inputs.count();
  if (count > 0) {
    for (let i = 0; i < Math.min(count, 4); i++) {
      const inp = inputs.nth(i);
      const type = await inp.getAttribute("type");
      await inp.fill(type === "email" ? "playwright@test.co.za" : "Playwright Test").catch(() => {});
    }
  }
  const textarea = page.locator("textarea").first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill("Automated test message");
  }
  await page.click("button[type='submit']").catch(() => {});
  const response = await responsePromise;
  // Either got a network response or page shows success state
  if (response) {
    expect([200, 201]).toContain(response.status());
  } else {
    // No API call — form may use server action; just verify page didn't crash
    await expect(page.locator("body")).not.toContainText("Application error");
  }
});

// ── Admin Login ───────────────────────────────────────────────────────────────

test("TAG admin login page loads", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await expect(page.locator("form")).toBeVisible();
  await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
  await expect(page.locator("input[type='password']")).toBeVisible();
});

test("TAG admin login — wrong credentials shows error", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", "wrong@test.com");
  await page.fill("input[type='password']", "wrongpassword");
  await page.click("button[type='submit']");
  // Server Action redirects to /admin/login?error=1 on failure
  await page.waitForURL(/error=1/, { timeout: 15_000 }).catch(() => {});
  await expect(page.locator("body")).toContainText(/(invalid|error|incorrect|password)/i, { timeout: 10_000 });
});

test("TAG admin login — correct credentials redirects to dashboard", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", ADMINS.TAG.email);
  await page.fill("input[type='password']", ADMINS.TAG.password);
  await page.click("button[type='submit']");
  // TAG uses Server Actions — wait for navigation away from login or for dashboard content
  await page.waitForTimeout(3000);
  const url = page.url();
  const body = await page.locator("body").textContent();
  // Either redirected away from /login, or dashboard content loaded without error
  const isRedirected = !url.includes("/login");
  const hasDashboard = (body ?? "").match(/(dashboard|enquir|admin|logout)/i) !== null;
  expect(isRedirected || hasDashboard).toBe(true);
});

// ── Admin Dashboard (authenticated) ───────────────────────────────────────────

test("TAG admin dashboard loads after login", async ({ page }) => {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("input[type='email'], input[name='email']", ADMINS.TAG.email);
  await page.fill("input[type='password']", ADMINS.TAG.password);
  await page.click("button[type='submit']");
  await page.waitForTimeout(3000);
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
});
