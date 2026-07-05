"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  BookOpen,
  TrendingUp,
  Award,
  RefreshCw,
  User,
  HelpCircle,
  LogOut,
  Bell,
  ChevronRight,
} from "lucide-react";

type Lang = "en" | "zu";

const NAV_LABELS: Record<Lang, {
  tasks: string;
  course: string;
  progress: string;
  certificate: string;
  cpd: string;
  profile: string;
  support: string;
  bulletins: string;
  profileComplete: string;
  logOut: string;
  driverUniversity: string;
}> = {
  en: {
    tasks: "Dashboard",
    course: "My Course",
    progress: "My Progress",
    certificate: "My Certificate",
    cpd: "CPD & Refresh",
    profile: "My Profile",
    support: "Support",
    bulletins: "Bulletins",
    profileComplete: "Profile complete",
    logOut: "Log out",
    driverUniversity: "Driver University",
  },
  zu: {
    tasks: "I-Dashboard",
    course: "Ikhosi Yami",
    progress: "Inqubekela Phambili",
    certificate: "Isitifiketi Sami",
    cpd: "Ukuqeqesha Okuqhubekayo",
    profile: "Iphrofayeli Yami",
    support: "Usizo",
    bulletins: "Izaziso",
    profileComplete: "Iphrofayeli igcwele",
    logOut: "Phuma",
    driverUniversity: "Yunivesithi Yabashayeli",
  },
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [driver, setDriver] = useState<{ firstName: string; lastName: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const [lang, setLang] = useState<Lang>("en");

  // Register service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Read language from cookie
  useEffect(() => {
    const cookieLang = getCookie("bd_lang");
    if (cookieLang === "zu") setLang("zu");
  }, []);

  // Auth check — falls back to demo mode when Supabase is not yet connected
  useEffect(() => {
    fetch("/api/driver/me")
      .then((r) => {
        if (r.status === 401) {
          setDriver({ firstName: "Demo", lastName: "Driver" });
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.driver) {
          setDriver({ firstName: d.driver.first_name, lastName: d.driver.last_name });
          if (d.driver.language_preference === "zu") setLang("zu");
        }
      })
      .finally(() => setChecking(false));
  }, []);

  // Unread bulletins
  useEffect(() => {
    fetch("/api/portal/bulletins/unread-count")
      .then((r) => r.json())
      .then((d) => setUrgentCount(d.count ?? 0))
      .catch(() => setUrgentCount(2));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  const labels = NAV_LABELS[lang];

  const NAV = [
    { href: "/portal", label: labels.tasks, icon: CheckSquare, exact: true },
    { href: "/portal/learning", label: labels.course, icon: BookOpen },
    { href: "/portal/progress", label: labels.progress, icon: TrendingUp },
    { href: "/portal/certificate", label: labels.certificate, icon: Award },
    { href: "/portal/cpd", label: labels.cpd, icon: RefreshCw },
    { href: "/portal/bulletins", label: labels.bulletins, icon: Bell, badge: true },
    { href: "/portal/profile", label: labels.profile, icon: User },
    { href: "/portal/support", label: labels.support, icon: HelpCircle },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (pathname === null) return false;
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = driver
    ? `${driver.firstName[0] ?? ""}${driver.lastName[0] ?? ""}`.toUpperCase()
    : "BD";

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            background: "linear-gradient(135deg, var(--amber), var(--amber-dark))",
            borderRadius: "0.625rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#0d1526",
            fontSize: "1rem",
          }}
        >
          BD
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading your portal…</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .pwa-sidebar { display: none; }
        .pwa-main { padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }
        @media (min-width: 768px) {
          .pwa-sidebar { display: flex !important; flex-direction: column; width: 240px; min-height: 100vh; background: var(--bg-card); border-right: 1px solid var(--border); position: sticky; top: 0; height: 100vh; overflow-y: auto; flex-shrink: 0; }
          .mobile-app-bar { display: none !important; }
          .bottom-nav { display: none !important; }
          .pwa-main { margin-left: 0; padding-bottom: 2rem; }
        }
      `}</style>

      <div className="pwa-shell">
        {/* ── Desktop sidebar ── */}
        <aside className="pwa-sidebar">
          {/* Logo */}
          <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div
                style={{
                  width: "2rem",
                  height: "2rem",
                  background: "linear-gradient(135deg, var(--amber), var(--amber-dark))",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#0d1526",
                  fontSize: "0.8125rem",
                }}
              >
                BD
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                BetterDriver
              </span>
            </Link>
          </div>

          {/* Driver info */}
          {driver && (
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar">{initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                    {driver.firstName} {driver.lastName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {labels.driverUniversity}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
            {NAV.map(({ href, label, icon: Icon, badge, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`portal-nav-item${active ? " active" : ""}`}
                >
                  <div style={{ position: "relative" }}>
                    <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
                    {badge && urgentCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-6px",
                          minWidth: "14px",
                          height: "14px",
                          background: "var(--danger)",
                          color: "white",
                          fontSize: "0.5625rem",
                          fontWeight: 700,
                          borderRadius: "9999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 3px",
                        }}
                      >
                        {urgentCount}
                      </span>
                    )}
                  </div>
                  {label}
                  {active && (
                    <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleLogout}
              className="portal-nav-item"
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer" }}
            >
              <LogOut size={17} strokeWidth={1.75} />
              {labels.logOut}
            </button>
          </div>
        </aside>

        {/* ── Mobile top bar ── */}
        <div className="mobile-app-bar app-bar" style={{ position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "1.75rem",
                height: "1.75rem",
                background: "linear-gradient(135deg, var(--amber), var(--amber-dark))",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#0d1526",
                fontSize: "0.75rem",
              }}
            >
              BD
            </div>
            <span className="app-bar-title">BetterDriver</span>
          </div>
          {driver && (
            <div className="avatar" style={{ width: "2rem", height: "2rem", fontSize: "0.75rem" }}>
              {initials}
            </div>
          )}
        </div>

        {/* ── Page content ── */}
        <main className="pwa-main page-content" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="bottom-nav" aria-label="Main navigation">
          {NAV.slice(0, 5).map(({ href, label, icon: Icon, badge, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`bottom-nav-item tap-target${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <div style={{ position: "relative" }}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                  {badge && urgentCount > 0 && (
                    <span className="bottom-nav-badge">{urgentCount}</span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
