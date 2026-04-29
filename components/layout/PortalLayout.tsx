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
import { SITE_NAME, MOCK_DRIVER } from "@/lib/constants";

// DATA REQUIREMENTS:
// - driver: Driver (from Supabase auth session — trpc.auth.me or Supabase getUser)
// - activeRoute: string (current pathname — from usePathname)
// TODO: Asif — replace MOCK_DRIVER with live Supabase session user

const PORTAL_NAV = [
  { label: "My Tasks", href: "/portal/tasks", icon: CheckSquare },
  { label: "My Course", href: "/portal/course", icon: BookOpen },
  { label: "My Progress", href: "/portal/progress", icon: TrendingUp },
  { label: "My Certificate", href: "/portal/certificate", icon: Award },
  { label: "CPD & Refresh", href: "/portal/cpd", icon: RefreshCw },
  { label: "My Profile", href: "/portal/profile", icon: User },
  { label: "Support", href: "/portal/support", icon: HelpCircle },
];

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // TODO: Asif — replace with live Supabase session
  const driver = MOCK_DRIVER;

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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: "0.875rem",
              color: "#111827",
            }}
          >
            BD
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#F9FAFB" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#F59E0B",
              }}
            >
              {driver.name.charAt(0)}
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#F9FAFB", margin: 0 }}>
                {driver.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>{driver.companyName}</p>
            </div>
          </div>
          {/* Profile completion */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "#6B7280" }}>Profile complete</span>
              <span style={{ fontSize: "0.6875rem", color: "#F59E0B", fontWeight: 600 }}>{driver.profileCompletionPercent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${driver.profileCompletionPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          {PORTAL_NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`portal-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: "1px solid #2d3a4f", paddingTop: "1rem", marginTop: "1rem" }}>
          {/* TODO: Asif — wire to Supabase signOut */}
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
            <span>Log out</span>
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
