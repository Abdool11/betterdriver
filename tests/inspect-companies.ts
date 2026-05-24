import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching from companies:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in companies:", Object.keys(data[0]));
    console.log("Sample data:", data[0]);
  } else {
    // If no data, try to get columns via a known-fail insert
    const { error: insertError } = await supabase.from('companies').insert({});
    console.log("Insert error (to see failing row):", insertError);
  }
}

inspectCompanies();
