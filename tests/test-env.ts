import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../betterdriver/.env.local") });

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Service Key prefix:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
