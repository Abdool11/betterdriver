import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching from drivers:", error);
  } else {
    console.log("Columns in drivers:", data.length > 0 ? Object.keys(data[0]) : "No data to inspect columns");
  }

  // Also check if drivers table exists by querying information_schema if possible via rpc or just raw query
  // Since I have service role key, I might be able to use a trick or just look at the error more closely.
}

inspectTable();
