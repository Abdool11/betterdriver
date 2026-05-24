import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRel() {
  // Try to select with companies relationship
  const { error } = await supabase
    .from("driver_invitations")
    .select(`id, companies ( id, name )`)
    .limit(1);

  if (error) {
    console.log("Relationship Error:", error.message);
  } else {
    console.log("Relationship Success!");
  }
}

testRel();
