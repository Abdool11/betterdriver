import Link from "next/link";
import Image from "next/image";
import {
  FOOTER_LINKS,
  LOGO_HIRES_URL,
  SITE_NAME,
  SITE_TAGLINE,
  ECOSYSTEM_URLS,
} from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-navy-950">
      {/* ─── Main footer ──────────────────────────────────────────────── */}
      <div className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* ─── Brand column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <Image
                src={LOGO_HIRES_URL}
                alt={SITE_NAME}
                width={80}
                height={80}
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {SITE_TAGLINE}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={ECOSYSTEM_URLS.gfa}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-teal text-xs"
              >
                GreenFreightAcademy
              </a>
              <a
                href={ECOSYSTEM_URLS.betterDriver}
                target="_blank"
                rel="noopener noreferrer"
                className="badge text-xs"
              >
                BetterDriver
              </a>
              <a
                href={ECOSYSTEM_URLS.zeroAfrica}
                target="_blank"
                rel="noopener noreferrer"
                className="badge badge-blue text-xs"
              >
                ZeroAfrica
              </a>
            </div>
          </div>

          {/* ─── Link columns ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {FOOTER_LINKS.map((section) => (
              <div key={section.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  {section.heading}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      {"href" in link && (link as { href: string }).href.startsWith("http") ? (
                        <a
                          href={(link as { href: string }).href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={(link as { href: string }).href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Bottom bar ───────────────────────────────────────────────── */}
      <div className="border-t border-border/40">
        <div className="container py-5 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} Transport Action Group. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Part of the{" "}
              <a
                href={ECOSYSTEM_URLS.zeroAfrica}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                ZeroAfrica
              </a>{" "}
              ecosystem
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center sm:text-left">
            Transport Action Group (Pty) Ltd &mdash; Registration Number: K2021/8073/07 &mdash; Incorporated in the Republic of South Africa, 2021
          </p>
        </div>
      </div>
    </footer>
  );
}
