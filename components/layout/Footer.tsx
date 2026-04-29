"use client";

import Link from "next/link";
import { SITE_NAME, FOOTER_LINKS, EXTERNAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer
      style={{
        background: "#0D1520",
        borderTop: "1px solid #2d3a4f",
        padding: "4rem 0 2rem",
        marginTop: "auto",
      }}
    >
      <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "#111827",
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
            </div>
            <p style={{ color: "#6B7280", fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 220 }}>
              The driver development portal. Train. Certify. Build your professional record.
            </p>
          </div>

          {/* Driver Links */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#F9FAFB", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              For Drivers
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {FOOTER_LINKS.driver.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ color: "#6B7280", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F59E0B")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B7280")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Links */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#F9FAFB", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              My Portal
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {FOOTER_LINKS.portal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ color: "#6B7280", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F59E0B")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B7280")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#F9FAFB", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ecosystem
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {FOOTER_LINKS.ecosystem.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#6B7280", fontSize: "0.875rem", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F59E0B")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#6B7280")}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #2d3a4f",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <p style={{ color: "#4B5563", fontSize: "0.8125rem" }}>
            © {new Date().getFullYear()} BetterDriver. Part of the{" "}
            <a href={EXTERNAL_LINKS.zeroAfrica} target="_blank" rel="noopener noreferrer" style={{ color: "#6B7280", textDecoration: "none" }}>
              ZeroAfrica
            </a>{" "}
            ecosystem.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {FOOTER_LINKS.legal.map((link) => (
              <Link key={link.href} href={link.href} style={{ color: "#4B5563", fontSize: "0.8125rem", textDecoration: "none" }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
