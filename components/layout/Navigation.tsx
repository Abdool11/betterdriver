"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, NAV_CTA_PRIMARY, NAV_CTA_SECONDARY, SITE_NAME, LOGO_URL } from "@/lib/constants";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
        background: scrolled ? "rgba(17, 24, 39, 0.95)" : "transparent",
        borderBottom: scrolled ? "1px solid #2d3a4f" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
      }}
    >
      <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                fontSize: "1.125rem",
                color: "#111827",
                flexShrink: 0,
              }}
            >
              BD
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "#F9FAFB",
                letterSpacing: "-0.01em",
              }}
            >
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: "#9CA3AF",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#F9FAFB")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9CA3AF")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="hidden md:flex">
            <Link
              href={NAV_CTA_PRIMARY.href}
              style={{
                color: "#9CA3AF",
                fontSize: "0.9375rem",
                fontWeight: 500,
                textDecoration: "none",
                padding: "0.5rem 1rem",
              }}
            >
              {NAV_CTA_PRIMARY.label}
            </Link>
            <Link href={NAV_CTA_SECONDARY.href} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
              {NAV_CTA_SECONDARY.label}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: "0.5rem" }}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            style={{
              background: "#1C2333",
              border: "1px solid #2d3a4f",
              borderRadius: "0.75rem",
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
            className="md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  color: "#9CA3AF",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: "1px solid #2d3a4f", marginTop: "0.5rem", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link href={NAV_CTA_PRIMARY.href} onClick={() => setIsOpen(false)} style={{ color: "#9CA3AF", padding: "0.625rem 0.875rem", fontSize: "0.9375rem", textDecoration: "none" }}>
                {NAV_CTA_PRIMARY.label}
              </Link>
              <Link href={NAV_CTA_SECONDARY.href} onClick={() => setIsOpen(false)} className="btn-primary" style={{ textAlign: "center", fontSize: "0.875rem" }}>
                {NAV_CTA_SECONDARY.label}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
