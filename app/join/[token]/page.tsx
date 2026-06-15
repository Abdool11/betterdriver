import { redirect } from "next/navigation";
import { resolveInvitationToken, createSession } from "@/lib/auth";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    redirect("/start?error=missing-token");
  }

  const result = await resolveInvitationToken(token);

  if ("error" in result) {
    const errorMap: Record<string, string> = {
      invalid: "invalid-link",
      revoked: "link-deactivated",
      expired: "link-expired",
    };
    const errorCode = errorMap[result.code] ?? "invalid-link";
    redirect(`/start?error=${errorCode}`);
  }

  // Issue the 30-day rolling JWT session cookie
  await createSession(result.session);

  if (result.isFirstAccess) {
    const videoParam = result.inviteVideoUrl
      ? `?video=${encodeURIComponent(result.inviteVideoUrl)}`
      : "";

    if (!result.languagePreference) {
      redirect(`/portal/language${videoParam}`);
    }

    redirect(`/portal/welcome${videoParam}`);
  }

  redirect("/portal");
}
