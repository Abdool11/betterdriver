"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BookOpen, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

type DashboardResponse = {
  stats?: {
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

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        const response = await fetch("/api/portal/dashboard", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/start");
          return;
        }
        if (!response.ok) throw new Error("Could not load your current actions.");
        const nextData = (await response.json()) as DashboardResponse;
        if (active) setData(nextData);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your current actions.");
      }
    }

    void loadTasks();
    return () => { active = false; };
  }, []);

  if (error) return <div className="page-content"><TranslatedPageHeader pageKey="tasks" /><p style={{ color: "#fca5a5" }}>{error}</p></div>;
  if (!data) return <div className="page-content"><TranslatedPageHeader pageKey="tasks" /><p style={{ color: "#9CA3AF" }}>Loading your current actions…</p></div>;

  const stats = data.stats ?? {};
  const tasks: DriverTask[] = [];

  if (data.nextModule && (stats.totalModules ?? 0) > 0) {
    tasks.push({
      id: "learning",
      title: data.nextModule.name,
      description: `${stats.completedModules ?? 0} of ${stats.totalModules ?? 0} programme modules completed.`,
      actionLabel: (stats.completedModules ?? 0) > 0 ? "Continue learning" : "Start learning",
      href: `/portal/module/${data.nextModule.id}`,
      icon: "learning",
      priority: "action",
    });
  }

  if (stats.cpdDue) {
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

  if ((stats.unreadBulletins ?? 0) > 0) {
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
      <p style={{ color: "#9CA3AF", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>Actions shown here are based on your current assigned learning, CPD and company updates.</p>

      {tasks.length === 0 ? (
        <section style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "1rem", padding: "1.5rem", textAlign: "center" }}>
          <CheckCircle2 size={30} style={{ color: "#10B981", marginBottom: "0.75rem" }} />
          <h2 style={{ color: "#F9FAFB", fontSize: "1.125rem", margin: "0 0 0.375rem" }}>You are up to date</h2>
          <p style={{ color: "#9CA3AF", margin: 0 }}>There are no current training, CPD or company-update actions for this driver profile.</p>
        </section>
      ) : (
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
      )}
    </div>
  );
}
