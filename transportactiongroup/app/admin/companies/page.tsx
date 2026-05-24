export const dynamic = "force-dynamic";
import { requireAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Building2, Mail, Phone, Calendar } from "lucide-react";

export const metadata = { title: "Companies — TAG Admin" };

export default async function CompaniesPage() {
  await requireAdminSession();

  const { data: companies } = await supabaseAdmin
    .from("companies")
    .select("*, drivers(count)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#f9fafb", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Companies</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.9375rem" }}>
          {companies?.length ?? 0} registered GFA company accounts
        </p>
      </div>

      {!companies || companies.length === 0 ? (
        <div style={{
          background: "#0d1520",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "0.875rem",
          padding: "4rem",
          textAlign: "center",
          color: "#4b5563",
        }}>
          <Building2 size={40} style={{ margin: "0 auto 1rem", display: "block" }} />
          No companies registered yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {companies.map((company: any) => (
            <div key={company.id} style={{
              background: "#0d1520",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "0.875rem",
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}>
              <div>
                <h3 style={{ color: "#f9fafb", fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.375rem" }}>
                  {company.name}
                </h3>
                <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                  {company.contact_email && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#6b7280", fontSize: "0.8125rem" }}>
                      <Mail size={13} /> {company.contact_email}
                    </span>
                  )}
                  {company.contact_phone && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#6b7280", fontSize: "0.8125rem" }}>
                      <Phone size={13} /> {company.contact_phone}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#6b7280", fontSize: "0.8125rem" }}>
                    <Calendar size={13} /> {new Date(company.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "#22c55e",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: "1rem",
                  padding: "0.2rem 0.625rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}>
                  {company.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
