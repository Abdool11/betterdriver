import { Metadata } from "next";
import Link from "next/link";
import { MOCK_TASKS, MOCK_DRIVER } from "@/lib/constants";
import { AlertTriangle, Clock, BookOpen, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";

export const dynamic = "force-dynamic";


// DATA REQUIREMENTS:
// - driver: Driver — from Supabase auth session (ctx.user)
// - tasks: Task[] — from Supabase query: SELECT * FROM tasks WHERE driver_id = ? AND status != 'completed' ORDER BY priority ASC, due_date ASC
// - Task status values: 'overdue' | 'urgent' | 'in_progress' | 'upcoming' | 'completed'
// - Task type values: 'module' | 'cpd' | 'refresh' | 'evaluation' | 'profile'
// TODO: Asif — replace MOCK_TASKS with live Supabase query
// TODO: Asif — protect this route with Supabase Auth middleware (redirect to /login if no session)

export const metadata: Metadata = {
  title: "My Tasks",
};

export default function TasksPage() {
  // TODO: Asif — replace with live data
  const tasks = MOCK_TASKS;
  const driver = MOCK_DRIVER;

  const overdueTasks = tasks.filter((t) => t.status === "overdue");
  const urgentTasks = tasks.filter((t) => t.status === "urgent");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const upcomingTasks = tasks.filter((t) => t.status === "upcoming");

  return (
    <div className="page-content">
      {/* Mock data banner */}
      <div className="mock-banner" style={{ marginBottom: "1.5rem" }}>
        ⚠ MOCK DATA — Asif to connect live Supabase tasks query
      </div>

      {/* Header — translated */}
      <TranslatedPageHeader pageKey="tasks" driverFirstName={driver.name.split(" ")[0]} />

      {/* Overdue — highest priority */}
      {overdueTasks.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <AlertTriangle size={16} style={{ color: "#EF4444" }} />
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#EF4444", margin: 0 }}>
              Overdue ({overdueTasks.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {overdueTasks.map((task) => (
              <div key={task.id} className="task-card urgent">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#EF4444",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                        {task.title}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: "0 0 0.5rem" }}>{task.description}</p>
                      <span className="pill pill-red" style={{ fontSize: "0.6875rem" }}>
                        Overdue — {task.dueLabel}
                      </span>
                    </div>
                    <Link href={task.actionHref} className="btn-primary" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", flexShrink: 0 }}>
                      {task.actionLabel} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent */}
      {urgentTasks.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <Clock size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F59E0B", margin: 0 }}>
              Urgent ({urgentTasks.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {urgentTasks.map((task) => (
              <div key={task.id} className="task-card warning">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F59E0B",
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                        {task.title}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: "0 0 0.5rem" }}>{task.description}</p>
                      <span className="pill pill-amber" style={{ fontSize: "0.6875rem" }}>
                        Due {task.dueLabel}
                      </span>
                    </div>
                    <Link href={task.actionHref} className="btn-primary" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", flexShrink: 0 }}>
                      {task.actionLabel} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgressTasks.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <BookOpen size={16} style={{ color: "#3B82F6" }} />
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#3B82F6", margin: 0 }}>
              In progress ({inProgressTasks.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {inProgressTasks.map((task) => (
              <div key={task.id} className="task-card normal">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "rgba(59, 130, 246, 0.12)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    borderRadius: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3B82F6",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", margin: "0 0 0.25rem" }}>
                        {task.title}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: "0 0 0.75rem" }}>{task.description}</p>
                      {task.progressPercent !== undefined && (
                        <div style={{ maxWidth: 280 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>Progress</span>
                            <span style={{ fontSize: "0.75rem", color: "#F59E0B", fontWeight: 600 }}>{task.progressPercent}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${task.progressPercent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <Link href={task.actionHref} className="btn-primary" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", flexShrink: 0 }}>
                      {task.actionLabel} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <CheckCircle2 size={16} style={{ color: "#6B7280" }} />
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#6B7280", margin: 0 }}>
              Coming up ({upcomingTasks.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {upcomingTasks.map((task) => (
              <div key={task.id} className="task-card normal" style={{ opacity: 0.7 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#9CA3AF", margin: "0 0 0.25rem" }}>
                    {task.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: 0 }}>{task.dueLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}