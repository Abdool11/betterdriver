import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('driver_invitations')
    .insert({ token: 'test-token-' + Date.now() })
    .select();

  if (error) {
    console.log("Error details:", JSON.stringify(error, null, 2));
  } else {
    console.log("Columns in driver_invitations:", Object.keys(data[0]));
  }
}

testInsert();
