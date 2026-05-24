import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectColumns() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .ilike('email', 'test2_%') // This was the one that succeeded
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in drivers:", Object.keys(data[0]));
    console.log("Sample data:", data[0]);
  } else {
    console.log("No data found.");
  }
}

inspectColumns();
