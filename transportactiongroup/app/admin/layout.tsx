"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Building2,
  DollarSign,
  Mail,
  MessageSquare,
  CreditCard,
  Inbox,
  Users,
  BookOpen,
  LayoutDashboard,
  LogOut,
  BarChart2,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Company Details", href: "/admin/company-details", icon: Building2 },
  { label: "Programme Pricing", href: "/admin/pricing", icon: DollarSign },
  { label: "Email Settings", href: "/admin/email-settings", icon: Mail },
  { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
  { label: "Paystack", href: "/admin/paystack", icon: CreditCard },
  { label: "Enquiry Inbox", href: "/admin/enquiries", icon: Inbox },
  { label: "Companies", href: "/admin/companies", icon: Users },
  { label: "Driver Registry", href: "/admin/registry", icon: BookOpen },
  { label: "TCO Submissions", href: "/admin/tco-submissions", icon: BarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1a", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260,
        background: "#0d1520",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "0.5rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Settings size={16} color="white" />
            </div>
            <div>
              <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.2 }}>TAG Admin</div>
              <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>System Configuration</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", overflowY: "auto" }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (pathname?.startsWith(href + "/") ?? false);
            return (
              <Link key={href} href={href} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "0.125rem",
                color: active ? "#22c55e" : "#9ca3af",
                background: active ? "rgba(34,197,94,0.08)" : "transparent",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <form action="/api/admin/logout" method="POST">
            <button type="submit" style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              color: "#6b7280",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}>
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 260, flex: 1, padding: "2rem", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
