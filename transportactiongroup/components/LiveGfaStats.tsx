/**
 * LiveGfaStats — Server Component (TAG site)
 *
 * Fetches live training stats from the GFA public stats API endpoint.
 * Used in the TAG homepage impact strip to show live Training Seats Booked
 * and Certifications Completed numbers from the shared Supabase database.
 *
 * Falls back to static values if the GFA API is unreachable.
 * Revalidation: 15-minute ISR via `revalidate`.
 */

export const revalidate = 900; // 15 minutes

const FALLBACK = {
  drivers: 252,
  certificates: 207,
};

export async function fetchGfaStats() {
  try {
    const gfaUrl = process.env.NEXT_PUBLIC_GFA_URL ?? "https://www.greenfreightacademy.co.za";
    const res = await fetch(`${gfaUrl}/api/stats`, {
      next: { revalidate: 900 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    return {
      drivers: typeof data.drivers === "number" ? data.drivers : FALLBACK.drivers,
      certificates: typeof data.certificates === "number" ? data.certificates : FALLBACK.certificates,
    };
  } catch (err) {
    console.error("[TAG LiveGfaStats] Failed to fetch GFA stats:", err);
    return FALLBACK;
  }
}
