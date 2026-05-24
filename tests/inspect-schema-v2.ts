import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAllColumns() {
  const tables = ['drivers', 'companies', 'driver_invitations', 'deployments'];
  
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`);
    // Try to get one record
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (data && data.length > 0) {
      console.log(`Columns:`, Object.keys(data[0]));
    } else {
      // Try to get columns via a dummy insert that will fail on a non-existent column
      const { error: insertError } = await supabase.from(table).insert({ non_existent_column_for_inspection: true });
      if (insertError) {
        // The error message for non-existent column in PostgREST 11+ often doesn't list all columns
        // but we can try to select all columns if we know at least one
        const { error: selectError } = await supabase.from(table).select('non_existent_column_for_inspection');
        console.log(`Select Error:`, selectError?.message);
      }
    }
  }
}

inspectAllColumns();
