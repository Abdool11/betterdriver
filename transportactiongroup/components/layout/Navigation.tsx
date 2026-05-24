"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV_LINKS, NAV_CTA, LOGO_WITH_TEXT_URL, SITE_NAME } from "@/lib/constants";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-900/95 backdrop-blur-md border-b border-border/60 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-20">
          {/* ─── Logo — prominent, with text ─────────────────────────── */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative h-16 w-auto">
              <Image
                src={LOGO_WITH_TEXT_URL}
                alt={SITE_NAME}
                width={240}
                height={64}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* ─── Desktop Nav ──────────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ─── Desktop CTA ──────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/contact" className="btn-ghost text-sm">
              Contact
            </Link>
            <Link href={NAV_CTA.href} className="btn-primary text-xs px-3 py-1.5">
              {NAV_CTA.label}
            </Link>
          </div>

          {/* ─── Mobile Menu Toggle ───────────────────────────────────── */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Menu ──────────────────────────────────────────────── */}
      {isOpen && (
        <div className="lg:hidden bg-navy-900/98 backdrop-blur-md border-t border-border/60">
          <div className="container py-6">
            {/* Mobile logo */}
            <div className="mb-6 pb-6 border-b border-border/40">
              <Image
                src={LOGO_WITH_TEXT_URL}
                alt={SITE_NAME}
                width={160}
                height={44}
                className="h-11 w-auto object-contain"
              />
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
              >
                Contact
              </Link>
            </nav>

            <div className="mt-6 pt-6 border-t border-border/40">
              <Link
                href={NAV_CTA.href}
                onClick={() => setIsOpen(false)}
                className="btn-primary w-full justify-center"
              >
                {NAV_CTA.label}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
