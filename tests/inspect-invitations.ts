import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectInvitations() {
  const { data, error } = await supabase
    .from('driver_invitations')
    .select('*')
    .limit(1);

  if (error) {
    console.log("Error fetching from driver_invitations:", error);
  } else {
    console.log("Columns in driver_invitations:", data.length > 0 ? Object.keys(data[0]) : "No data");
  }
}

inspectInvitations();
