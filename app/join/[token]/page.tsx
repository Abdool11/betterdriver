import { redirect } from "next/navigation";
import { resolveInvitationToken, createSession } from "@/lib/auth";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  console.error("[JOIN_PAGE] Received token:", token ? token.slice(0, 8) + "..." : "(empty)");

  if (!token) {
    console.error("[JOIN_PAGE] Missing token — redirecting");
    redirect("/start?error=missing-token");
  }

  const result = await resolveInvitationToken(token);

  if ("error" in result) {
    console.error("[JOIN_PAGE] resolveInvitationToken error:", result.code, "—", result.error);
    const errorMap: Record<string, string> = {
      invalid: "invalid-link",
      revoked: "link-deactivated",
      expired: "link-expired",
    };
    const errorCode = errorMap[result.code] ?? "invalid-link";
    redirect(`/start?error=${errorCode}`);
  }

  console.error("[JOIN_PAGE] Token valid. isFirstAccess:", result.isFirstAccess, "lang:", result.session.languagePreference);

  // Issue the 30-day rolling JWT session cookie
  await createSession(result.session);

  if (result.isFirstAccess) {
    const videoParam = result.inviteVideoUrl
      ? `?video=${encodeURIComponent(result.inviteVideoUrl)}`
      : "";

    if (!result.session.languagePreference) {
      redirect(`/portal/language${videoParam}`);
    }

    redirect(`/portal/welcome${videoParam}`);
  }

  redirect("/portal");
}
