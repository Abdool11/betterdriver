import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  const table = 'deployments';
  console.log(`\n--- ${table} ---`);
  const likely = ['id', 'created_at', 'updated_at', 'company_id', 'quote_id', 'status', 'approved_at', 'approved_by', 'deployed_at', 'cohort_id', 'campaign_id'];
  for (const col of likely) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (!error) {
      process.stdout.write(`${col}, `);
    } else {
      // console.log(`\nError for ${col}: ${error.message}`);
    }
  }
  console.log('\n');
}

inspectSchema();
