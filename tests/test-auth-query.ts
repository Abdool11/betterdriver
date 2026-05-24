import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthQuery() {
  const opaqueToken = 'dummy';
  const { data: invitation, error } = await supabase
    .from("driver_invitations")
    .select(`
      id, token, driver_id, company_id,
      expires_at, first_accessed_at, revoked_at,
      program_assignment, invite_video_url,
      drivers ( id, full_name, email, phone, activation_status, profile_complete, language_preference ),
      companies ( id, name )
    `)
    .eq("token", opaqueToken)
    .single();

  if (error) {
    console.log("Error with FIXED query:", error.message);
  } else {
    console.log("Success with FIXED query!");
  }

  const { error: errorOrig } = await supabase
    .from("driver_invitations")
    .select(`
      id, token, driver_id, deployment_id,
      expires_at, first_accessed_at, revoked_at,
      program_assignment, invite_video_url,
      drivers ( id, first_name, last_name, email, mobile, activation_status, profile_complete, language_preference ),
      deployments ( id, company_id, cohort_id, companies ( id, name ) )
    `)
    .eq("token", opaqueToken)
    .single();

  if (errorOrig) {
    console.log("Error with ORIGINAL query:", errorOrig.message);
  }
}

testAuthQuery();
