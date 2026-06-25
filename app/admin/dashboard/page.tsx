import { requireBDAdminSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ACTIVE_ENROLMENT_STATUSES } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";


async function getStats() {
  const [
    { count: totalDrivers },
    { count: activatedDrivers },
    { count: activeEnrolments },
    { count: completedEnrolments },
    { count: totalCerts },
    { count: pendingInvitations },
  ] = await Promise.all([
    supabaseAdmin.from("drivers").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("drivers").select("*", { count: "exact", head: true }).eq("activation_status", "activated"),
    supabaseAdmin.from("enrolments").select("*", { count: "exact", head: true }).in("status", ACTIVE_ENROLMENT_STATUSES),
    supabaseAdmin.from("enrolments").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabaseAdmin.from("certifications").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("driver_invitations").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    totalDrivers: totalDrivers ?? 0,
    activatedDrivers: activatedDrivers ?? 0,
    activeEnrolments: activeEnrolments ?? 0,
    completedEnrolments: completedEnrolments ?? 0,
    totalCerts: totalCerts ?? 0,
    pendingInvitations: pendingInvitations ?? 0,
  };
}

async function getRecentDrivers() {
  const { data } = await supabaseAdmin
    .from("drivers")
    .select("id, first_name, last_name, email, mobile, activation_status, created_at, companies(name)")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export default async function BDAdminDashboardPage() {
  const session = await requireBDAdminSession();
  const stats = await getStats();
  const recentDrivers = await getRecentDrivers();

  const activationRate = stats.totalDrivers > 0
    ? Math.round((stats.activatedDrivers / stats.totalDrivers) * 100)
    : 0;

  const completionRate = stats.activeEnrolments + stats.completedEnrolments > 0
    ? Math.round((stats.completedEnrolments / (stats.activeEnrolments + stats.completedEnrolments)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Top nav */}
      <nav className="bg-[#161b22] border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-white">BetterDriver Admin</span>
            <span className="text-slate-500 text-sm">/ Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{session.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f97316]/20 text-[#f97316]">Admin</span>
            <form action="/api/admin/auth/logout" method="POST">
              <button type="submit" className="text-slate-400 hover:text-white text-sm transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Sidebar + Content */}
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="w-52 min-h-[calc(100vh-65px)] bg-[#0d1117] border-r border-slate-700/50 py-6 px-3 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { href: "/admin/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
              { href: "/admin/dashboard", label: "Drivers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
              { href: "/admin/invitations", label: "Invitations", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { href: "/admin/bulletins", label: "Bulletins", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
              { href: "/admin/cpd", label: "CPD Modules", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
              { href: "/admin/programmes", label: "Programmes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { href: "/admin/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Driver Platform Overview</h1>
            <p className="text-slate-400 text-sm mt-1">BetterDriver · Live data</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Drivers", value: stats.totalDrivers, color: "text-white", sub: "registered" },
              { label: "Activated", value: stats.activatedDrivers, color: "text-[#f97316]", sub: `${activationRate}% activation rate` },
              { label: "In Training", value: stats.activeEnrolments, color: "text-blue-400", sub: "active enrolments" },
              { label: "Completed", value: stats.completedEnrolments, color: "text-green-400", sub: `${completionRate}% completion rate` },
              { label: "Certificates", value: stats.totalCerts, color: "text-amber-400", sub: "issued" },
              { label: "Pending Invites", value: stats.pendingInvitations, color: stats.pendingInvitations > 0 ? "text-cyan-400" : "text-slate-500", sub: "not yet activated" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#161b22] border border-slate-700/50 rounded-xl p-5">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</div>
                <div className="text-white text-sm font-medium mt-1">{stat.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Recent drivers */}
          <div className="bg-[#161b22] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Drivers</h2>
              <Link href="/admin/dashboard" className="text-[#f97316] text-sm hover:underline">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-slate-400 font-medium pb-3">Driver</th>
                    <th className="text-left text-slate-400 font-medium pb-3">Company</th>
                    <th className="text-left text-slate-400 font-medium pb-3">Status</th>
                    <th className="text-left text-slate-400 font-medium pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDrivers.map((d: Record<string, unknown>) => {
                    const company = (d.companies as unknown) as Record<string, string> | null;
                    return (
                      <tr key={String(d.id ?? "")} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                        <td className="py-3">
                          <div className="text-white font-medium">{String(d.first_name ?? "")} {String(d.last_name ?? "")}</div>
                          <div className="text-slate-500 text-xs">{String(d.email ?? d.mobile ?? "")}</div>
                        </td>
                        <td className="py-3 text-slate-400">{company?.name ?? "—"}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            d.activation_status === "certified" ? "bg-green-500/20 text-green-400" :
                            d.activation_status === "activated" ? "bg-[#f97316]/20 text-[#f97316]" :
                            "bg-slate-700 text-slate-400"
                          }`}>
                            {String(d.activation_status ?? "")}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 text-xs">
                          {new Date(String(d.created_at ?? "")).toLocaleDateString("en-ZA")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {recentDrivers.length === 0 && (
                <p className="text-slate-500 text-sm py-4 text-center">No drivers registered yet</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
