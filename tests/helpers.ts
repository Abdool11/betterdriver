// Shared test helpers and constants

export const URLS = {
  TAG: "http://localhost:3000",
  GFA: "http://localhost:3001",
  BD:  "http://localhost:3002",
};

export const ADMINS = {
  TAG: { email: "admin@transportactiongroup.co.za", password: "TagAdmin2024!" },
  GFA: { email: "admin@greenfreightacademy.co.za",  password: "GfaAdmin2024!" },
  BD:  { email: "admin@betterdriver.co.za",          password: "BdAdmin2024!" },
};

export const TEST_COMPANY = {
  companyName: "Test Logistics ZA",
  contactName: "Test Admin",
  email:       `testco_${Date.now()}@testdomain.co.za`,
  phone:       "+27831234567",
  password:    "TestCompany@2024",
  fleetSize:   "5",
};

export const TEST_DRIVER = {
  firstname: "Test",
  lastname:  "Driver",
  email:     `testdriver_${Date.now()}@testdomain.co.za`,
  phone:     "+27831234567",
};

// Generic JSON fetch helper for API tests
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<{ status: number; body: any }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  let body: any;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

// Helper to get admin session cookie
export async function getAdminSession(
  baseUrl: string,
  email: string,
  password: string
): Promise<string | null> {
  const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const cookies = res.headers.get("set-cookie");
  return cookies;
}

// Helper to get company session cookie
export async function getCompanySession(
  baseUrl: string,
  email: string,
  password: string
): Promise<string | null> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const cookies = res.headers.get("set-cookie");
  return cookies;
}

// Parse cookies from Set-Cookie header
export function parseCookies(setCookieHeader: string | null): Record<string, string> {
  if (!setCookieHeader) return {};
  const cookies: Record<string, string> = {};
  setCookieHeader.split(',').forEach(cookie => {
    const [nameValue] = cookie.trim().split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      cookies[name.trim()] = value.trim();
    }
  });
  return cookies;
}

// Format cookies for Cookie header
export function formatCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}
