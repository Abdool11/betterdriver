import { requireAdminSession } from "@/lib/admin-auth";
import Link from "next/link";
import {
  Building2, Mail, MessageSquare, CreditCard, Users,
  Inbox, BookOpen, DollarSign, ArrowRight, AlertCircle,
  BarChart3,
} from "lucide-react";

const SECTIONS = [
  {
    title: "Company Details",
    description: "Public-facing company name, address, registration number, and contact email displayed on the site.",
    href: "/admin/company-details",
    icon: Building2,
    color: "#3b82f6",
  },
  {
    title: "Email Settings",
    description: "Configure notification addresses for enquiries, bookings, and deployments.",
    href: "/admin/email-settings",
    icon: Mail,
    color: "#f59e0b",
  },
  {
    title: "WhatsApp",
    description: "WhatsApp Cloud API credentials and driver welcome message templates.",
    href: "/admin/whatsapp",
    icon: MessageSquare,
    color: "#10b981",
  },
  {
    title: "Paystack",
    description: "Payment gateway credentials. Toggle between test and live mode.",
    href: "/admin/paystack",
    icon: CreditCard,
    color: "#8b5cf6",
  },
  {
    title: "Impact Stats",
    description: "Set the numbers shown in the bragging strip across TAG, GFA, and BD. Toggle between static values and live database counts.",
    href: "/admin/stats",
    icon: Users,
    color: "#22c55e",
  },
  {
    title: "Enquiry Inbox",
    description: "View and manage all partnership and booking enquiries from TAG and GFA.",
    href: "/admin/enquiries",
    icon: Inbox,
    color: "#ec4899",
  },
  {
    title: "Companies",
    description: "View registered GFA company accounts and manage access.",
    href: "/admin/companies",
    icon: Users,
    color: "#06b6d4",
  },
  {
    title: "Driver Registry",
    description: "View all certified drivers, search, and export to CSV.",
    href: "/admin/registry",
    icon: BookOpen,
    color: "#f97316",
  },
  {
    title: "Pricing",
    description: "Manage GFA course and module pricing displayed on the pricing page.",
    href: "/admin/pricing",
    icon: DollarSign,
    color: "#22c55e",
  },
  {
    title: "TCO Calculator Submissions",
    description: "View all TCO calculator sessions — who ran the calculator, their inputs, and results. Export to CSV.",
    href: "/admin/tco-submissions",
    icon: BarChart3,
    color: "#a78bfa",
  },
];

export default async function AdminDashboardPage() {
  await requireAdminSession();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#f9fafb", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          System Configuration
        </h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9375rem" }}>
          Manage all platform settings, pricing, integrations, and data from this panel.
        </p>
      </div>

      {/* Setup status banner */}
      <div style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}>
        <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ color: "#fcd34d", fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>
            Initial setup required
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.8125rem", margin: "0.25rem 0 0" }}>
            Please complete Company Details, Email Settings, and Paystack configuration before going live. WhatsApp credentials are required for automated driver deployment.
          </p>
        </div>
      </div>

      {/* Config sections grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1rem",
      }}>
        {SECTIONS.map(({ title, description, href, icon: Icon, color }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div className="admin-nav-card" style={{
              background: "#0d1520",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.875rem",
              padding: "1.5rem",
              cursor: "pointer",
              height: "100%",
              transition: "border-color 0.15s, background 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{
                  width: 40, height: 40,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  borderRadius: "0.625rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={color} />
                </div>
                <ArrowRight size={16} color="#374151" />
              </div>
              <h3 style={{ color: "#f9fafb", fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.375rem" }}>
                {title}
              </h3>
              <p style={{ color: "#6b7280", fontSize: "0.8125rem", lineHeight: 1.5, margin: 0 }}>
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {/* CSS hover styles — avoids Server Component event handler crash */}
      <style>{`
        .admin-nav-card:hover {
          border-color: rgba(255,255,255,0.12) !important;
          background: #111827 !important;
        }
      `}</style>
    </div>
  );
}
