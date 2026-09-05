import { createClient } from "@supabase/supabase-js";

// Use placeholder values during build time to prevent "supabaseUrl is required" errors
// Real values must be set via environment variables at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

// Public client (for client-side use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (for server-side use only — has full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ─── Site Config helpers ──────────────────────────────────────────────────────
// Reads/writes to the shared site_config table (shared with TAG and GFA).
// Use BD-specific key prefixes (bd_*) to avoid collisions.

export async function getConfig(key: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("site_config")
    .select("value")
    .eq("key", key)
    .single();
  if (error || !data) return null;
  return data.value as string;
}

export async function getConfigs(keys: string[]): Promise<Record<string, string>> {
  const { data, error } = await supabaseAdmin
    .from("site_config")
    .select("key, value")
    .in("key", keys);
  if (error || !data) return {};
  return Object.fromEntries((data as { key: string; value: string }[]).map((r) => [r.key, r.value]));
}

export async function setConfig(key: string, value: string): Promise<void> {
  await supabaseAdmin
    .from("site_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}
