export const dynamic = "force-dynamic";

import { requireDriverSession } from "@/lib/auth";
import WelcomePageClient from "./WelcomePageClient";

export default async function WelcomePage() {
  const session = await requireDriverSession();
  return <WelcomePageClient session={session} />;
}
