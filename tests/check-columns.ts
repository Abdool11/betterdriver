import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  const testData = {
    email: `test_${Date.now()}@example.com`,
    full_name: "Test Driver",
    first_name: "Test",
    last_name: "Driver"
  };

  console.log("Trying insert with full_name, first_name, last_name...");
  const { error } = await supabase.from('drivers').insert(testData);
  
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! All columns existed or were ignored.");
  }

  console.log("\nTrying insert with ONLY full_name and email...");
  const { error: error2 } = await supabase.from('drivers').insert({
    email: `test2_${Date.now()}@example.com`,
    full_name: "Test Driver 2"
  });
  if (error2) console.log("Error 2:", error2.message);
  else console.log("Success 2!");

  console.log("\nTrying insert with ONLY first_name, last_name and email...");
  const { error: error3 } = await supabase.from('drivers').insert({
    email: `test3_${Date.now()}@example.com`,
    first_name: "Test",
    last_name: "Driver"
  });
  if (error3) console.log("Error 3:", error3.message);
  else console.log("Success 3!");
}

checkColumns();
