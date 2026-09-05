"use client";

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
  ChevronRight,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

type Lang = "en" | "zu";

// Translated nav labels
const NAV_LABELS: Record<Lang, {
  tasks: string;
  course: string;
  progress: string;
  certificate: string;
  cpd: string;
  profile: string;
  support: string;
  profileComplete: string;
  logOut: string;
}> = {
  en: {
    tasks: "My Tasks",
    course: "My Course",
    progress: "My Progress",
    certificate: "My Certificate",
    cpd: "CPD & Refresh",
    profile: "My Profile",
    support: "Support",
    profileComplete: "Profile complete",
    logOut: "Log out",
  },
  zu: {
    tasks: "Imisebenzi Yami",
    course: "Ikhosi Yami",
    progress: "Inqubekela Phambili",
    certificate: "Isitifiketi Sami",
    cpd: "Ukuqeqesha Okuqhubekayo",
    profile: "Iphrofayeli Yami",
    support: "Usizo",
    profileComplete: "Iphrofayeli igcwele",
    logOut: "Phuma",
  },
};

interface PortalLayoutProps {
  children: React.ReactNode;
  // Driver info — passed from authenticated server components once live data is wired
  driverName?: string;
  companyName?: string;
  profileCompletionPercent?: number;
  languagePreference?: string;
}

export function PortalLayout({
  children,
  driverName = "Driver",
  companyName = "",
  profileCompletionPercent = 0,
  languagePreference,
}: PortalLayoutProps) {
  const pathname = usePathname();
  const lang: Lang = languagePreference === "zu" ? "zu" : "en";
  const labels = NAV_LABELS[lang];

  const PORTAL_NAV = [
    { label: labels.tasks, href: "/portal/tasks", icon: CheckSquare },
    { label: labels.course, href: "/portal/course", icon: BookOpen },
    { label: labels.progress, href: "/portal/progress", icon: TrendingUp },
    { label: labels.certificate, href: "/portal/certificate", icon: Award },
    { label: labels.cpd, href: "/portal/cpd", icon: RefreshCw },
    { label: labels.profile, href: "/portal/profile", icon: User },
    { label: labels.support, href: "/portal/support", icon: HelpCircle },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111827" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: "#1C2333",
          borderRight: "1px solid #2d3a4f",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
        className="hidden md:flex"
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: "0.875rem",
              color: "#fff",
            }}
          >
            BD
          </div>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#F9FAFB",
            }}
          >
            {SITE_NAME}
          </span>
        </Link>

        {/* Driver info */}
        <div
          style={{
            background: "#243044",
            border: "1px solid #2d3a4f",
            borderRadius: "0.75rem",
            padding: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "rgba(20, 184, 166, 0.15)",
                border: "1px solid rgba(20, 184, 166, 0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#14b8a6",
              }}
            >
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "#F9FAFB",
                  margin: 0,
                }}
              >
                {driverName}
              </p>
              {companyName && (
                <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
                  {companyName}
                </p>
              )}
            </div>
          </div>

          {/* Profile completion */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
              }}
            >
              <span style={{ fontSize: "0.6875rem", color: "#6B7280" }}>
                {labels.profileComplete}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "#14b8a6",
                  fontWeight: 600,
                }}
              >
                {profileCompletionPercent}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${profileCompletionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            flex: 1,
          }}
        >
          {PORTAL_NAV.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`portal-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {isActive && (
                  <ChevronRight
                    size={14}
                    style={{ marginLeft: "auto", opacity: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{
            borderTop: "1px solid #2d3a4f",
            paddingTop: "1rem",
            marginTop: "1rem",
          }}
        >
          {/* TODO: Asif — wire to BD JWT session clear: DELETE /api/auth/logout */}
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "0.75rem",
              color: "#6B7280",
              fontSize: "0.9375rem",
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
              transition: "color 0.15s",
            }}
          >
            <LogOut size={18} />
            <span>{labels.logOut}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}
