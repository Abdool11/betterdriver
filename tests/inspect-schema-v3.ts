import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable(table: string) {
  console.log(`\n--- Inspecting ${table} ---`);
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    console.error(`Error selecting from ${table}:`, error.message);
    // If select * fails, try to get columns from error if it's a permission issue or something
  } else if (data && data.length > 0) {
    console.log(`Columns in ${table}:`, Object.keys(data[0]));
    console.log(`Sample row:`, JSON.stringify(data[0], null, 2));
  } else {
    console.log(`No data in ${table}.`);
    // Try to insert a record with a known-bad column to see the row layout in the error
    const { error: insertError } = await supabase.from(table).insert({ DUMMY_COLUMN: 1 });
    if (insertError) {
      console.log(`Insert Error (useful for row dump):`, insertError.message);
      if (insertError.details) console.log(`Details:`, insertError.details);
    }
  }
}

async function main() {
  await inspectTable('driver_invitations');
  await inspectTable('deployments');
}

main();
