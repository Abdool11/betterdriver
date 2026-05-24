import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  // Try to insert an empty object to see what columns are required/exist
  const { data, error } = await supabase
    .from('drivers')
    .insert({})
    .select();

  if (error) {
    console.log("Insert error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Insert success:", data);
  }
}

testInsert();
