import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  // Try to use rpc if there's a custom function, but let's try raw sql via a trick if possible
  // Supabase doesn't allow raw SQL via the client unless there's an RPC.
  // But we can try to guess columns based on common patterns and what we saw in the failing tests.
  
  const tables = ['driver_invitations', 'deployments'];
  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    // Try some likely columns
    const likely = ['id', 'created_at', 'updated_at', 'token', 'driver_id', 'company_id', 'expires_at', 'revoked_at', 'first_accessed_at', 'programme_slug', 'driver_name', 'status'];
    for (const col of likely) {
      const { error } = await supabase.from(table).select(col).limit(1);
      if (!error) {
        process.stdout.write(`${col}, `);
      }
    }
  }
}

inspectSchema();
