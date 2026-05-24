import { createClient } from "@supabase/supabase-js";

// Use placeholder values when env vars are missing so the build succeeds
// and the site runs in demo mode. Real values must be set in .env.local for production.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

// Public client — for browser-side reads (registry, courses)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service client — for server-side writes (forms, admin)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Fetch a single config value
export async function getConfig(key: string): Promise<string> {
  if (supabaseUrl === "https://placeholder.supabase.co") return "";
  const { data } = await supabaseAdmin
    .from("site_config")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? "";
}

// Fetch multiple config values as a record
export async function getConfigs(keys: string[]): Promise<Record<string, string>> {
  if (supabaseUrl === "https://placeholder.supabase.co") return {};
  const { data } = await supabaseAdmin
    .from("site_config")
    .select("key, value")
    .in("key", keys);
  const result: Record<string, string> = {};
  (data ?? []).forEach((row: { key: string; value: string }) => {
    result[row.key] = row.value ?? "";
  });
  return result;
}

// Update a config value
export async function setConfig(key: string, value: string): Promise<void> {
  if (supabaseUrl === "https://placeholder.supabase.co") return;
  await supabaseAdmin
    .from("site_config")
    .upsert({ key, value, updated_at: new Date().toISOString() });
}
