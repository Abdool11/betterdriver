"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Bell, BookOpen, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";
import ProgressRefreshControl from "@/components/portal/ProgressRefreshControl";
import { usePortalRefresh } from "@/components/portal/usePortalRefresh";
import { readPortalJson, isDashboardData, learningErrorText } from "@/lib/portal-read";

type DashboardResponse = {
  stats?: {
    learningStatus?: "available" | "unavailable" | "not_assigned";
    learningError?: { code: string; requestId: string } | null;
    cpdStatus?: "available" | "unavailable";
    bulletinStatus?: "available" | "unavailable";
    firstName?: string;
    programmeTitle?: string;
    progressPercent?: number;
    completedModules?: number;
    totalModules?: number;
    cpdDue?: boolean;
    cpdOverdueCount?: number;
    cpdUpcomingCount?: number;
    unreadBulletins?: number;
  };
  nextModule?: { id: string; name: string } | null;
};

type DriverTask = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: "learning" | "cpd" | "bulletin";
  priority: "action" | "normal";
};

export default function TasksPageClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async (signal: AbortSignal) => {
    try {
      const nextData = await readPortalJson("/api/portal/dashboard", signal, isDashboardData);
      if (!signal.aborted) { setData(nextData as DashboardResponse); setError(""); }
    } catch (error) {
      if (!signal.aborted) setError(error instanceof Error ? error.message : "Could not load your current actions.");
    }
  }, []);
  const { refresh, refreshing } = usePortalRefresh(loadTasks);
  const refreshControl = <ProgressRefreshControl refreshing={refreshing} onRefresh={() => void refresh()} error={error ? `${error}${data ? " Showing the last confirmed task information." : ""}` : undefined} />;
  if (!data) return <div className="page-content"><TranslatedPageHeader pageKey="tasks" />{!error && <p style={{ color: "#9CA3AF" }}>Loading your current actions…</p>}{refreshControl}</div>;

  const stats = data.stats ?? {};
  const tasks: DriverTask[] = [];
  const learningUnavailable = stats.learningStatus === "unavailable";
  const sourcesConfirmed = !error && !learningUnavailable && stats.cpdStatus === "available" && stats.bulletinStatus === "available";

  if (!error && !learningUnavailable && data.nextModule) {
    tasks.push({
      id: "learning",
      title: data.nextModule.name,
      description: (stats.totalModules ?? 0) > 0 ? `${stats.completedModules ?? 0} of ${stats.totalModules ?? 0} programme modules completed.` : "Open your assigned learning material. Completion is not assumed for untracked reference content.",
      actionLabel: (stats.completedModules ?? 0) > 0 ? "Continue learning" : "Start learning",
      href: `/portal/module/${data.nextModule.id}`,
      icon: "learning",
      priority: "action",
    });
  }

  if (!error && stats.cpdStatus === "available" && stats.cpdDue) {
    const outstanding = (stats.cpdOverdueCount ?? 0) + (stats.cpdUpcomingCount ?? 0);
    tasks.push({
      id: "cpd",
      title: "CPD activity requires attention",
      description: outstanding > 0 ? `${outstanding} CPD ${outstanding === 1 ? "activity is" : "activities are"} due or upcoming.` : "Review your assigned CPD activity.",
      actionLabel: "Open CPD",
      href: "/portal/cpd",
      icon: "cpd",
      priority: (stats.cpdOverdueCount ?? 0) > 0 ? "action" : "normal",
    });
  }

  if (!error && stats.bulletinStatus === "available" && (stats.unreadBulletins ?? 0) > 0) {
    const unread = stats.unreadBulletins ?? 0;
    tasks.push({
      id: "bulletins",
      title: "Company updates to read",
      description: `${unread} unread ${unread === 1 ? "bulletin" : "bulletins"} for your company.`,
      actionLabel: "View updates",
      href: "/portal/bulletins",
      icon: "bulletin",
      priority: "normal",
    });
  }

  const iconFor = (icon: DriverTask["icon"]) => icon === "learning" ? <BookOpen size={19} /> : icon === "cpd" ? <RefreshCw size={19} /> : <Bell size={19} />;

  return (
    <div className="page-content">
      <TranslatedPageHeader pageKey="tasks" driverFirstName={stats.firstName} />
      {refreshControl}
      {learningUnavailable && <p role="status" style={{ color: "#fca5a5" }}>{learningErrorText(stats.learningError)}</p>}
      {(stats.cpdStatus === "unavailable" || stats.bulletinStatus === "unavailable") && <p style={{ color: "#fbbf24" }}>Some CPD or company-update actions could not be checked. Please refresh to retry.</p>}
      <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>Actions shown here are based on your current assigned learning, CPD and company updates.</p>

      {tasks.length === 0 && sourcesConfirmed ? (
        <section style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
          <CheckCircle2 size={30} style={{ color: "#10B981", marginBottom: "0.75rem" }} />
          <h2 style={{ color: "#F9FAFB", fontSize: "1.125rem", margin: "0 0 0.375rem" }}>You are up to date</h2>
          <p style={{ color: "#9CA3AF", margin: 0 }}>There are no current training, CPD or company-update actions for this driver profile.</p>
        </section>
      ) : tasks.length > 0 ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {tasks.map((task) => (
            <Link key={task.id} href={task.href} style={{ textDecoration: "none", color: "inherit" }}>
              <article style={{ background: "#1C2333", border: `1px solid ${task.priority === "action" ? "rgba(245,158,11,0.3)" : "#2d3a4f"}`, borderRadius: "1rem", padding: "1rem 1.125rem", display: "flex", gap: "0.875rem", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, display: "grid", placeItems: "center", background: task.priority === "action" ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.1)", borderRadius: "0.75rem", color: task.priority === "action" ? "#F59E0B" : "#60A5FA", flexShrink: 0 }}>{iconFor(task.icon)}</div>
                <div style={{ minWidth: 0, flex: 1 }}><h2 style={{ color: "#F9FAFB", fontSize: "0.9375rem", margin: "0 0 0.25rem" }}>{task.title}</h2><p style={{ color: "#9CA3AF", fontSize: "0.8125rem", margin: 0, lineHeight: 1.45 }}>{task.description}</p></div>
                <span style={{ color: "#FCD34D", fontSize: "0.75rem", fontWeight: 700, textAlign: "right" }}>{task.actionLabel}<ChevronRight size={15} style={{ verticalAlign: "middle", marginLeft: "0.25rem" }} /></span>
              </article>
            </Link>
          ))}
        </div>
      ) : <p style={{ color: "#9CA3AF" }}>Your current training actions have not been confirmed. No completion or up-to-date status is assumed.</p>}
    </div>
  );
}
