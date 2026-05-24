import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectInvitationColumns() {
  const { data, error } = await supabase
    .from('driver_invitations')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in driver_invitations:", Object.keys(data[0]));
  } else {
    // Try to get columns via a known-fail insert or just a select with error
    const { error: selectError } = await supabase.from('driver_invitations').select('non_existent_column');
    console.log("Select error (to see if it helps):", selectError);
  }
}

inspectInvitationColumns();
