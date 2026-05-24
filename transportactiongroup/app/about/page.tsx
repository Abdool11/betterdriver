// DATA REQUIREMENTS:
// - No dynamic data required on this page
// - All content is static from lib/constants.ts and inline copy

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { LOGO_HIRES_URL, SITE_NAME, ECOSYSTEM_URLS } from "@/lib/constants";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "About Transport Action Group",
  description:
    "Transport Action Group is a South African strategic advisory specialising in green freight transformation, electric truck transition, and road freight sustainability. Founded by Abdool Kamdar.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-16">
          <span className="badge mb-4">About TAG</span>
          <h1 className="mb-6">
            Creating the enabling environment for{" "}
            <span className="gradient-text">green freight transformation</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            Transport Action Group is the advisory and facilitation platform that helps create the
            structural conditions for green freight transformation at national, industry, and
            corridor level.
          </p>
        </div>

        {/* Logo — prominent */}
        <div className="flex justify-center mb-16">
          <Image
            src={LOGO_HIRES_URL}
            alt={SITE_NAME}
            width={140}
            height={140}
            className="h-36 w-auto object-contain opacity-90"
          />
        </div>

        {/* What TAG is */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">What TAG is</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            TAG is not a training provider, a technology platform, or a generic sustainability
            consultancy. TAG is the enabling environment platform — the structure that makes
            transformation possible by aligning stakeholders, creating credible implementation
            pathways, and mobilising the ecosystem partners needed to sustain momentum.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The work TAG does — action plans, strategic workshops, publications, implementation
            support, and ecosystem mobilisation — is designed to shift the conditions under which
            green freight transformation happens, not just to advise individual organisations in
            isolation.
          </p>
        </div>

        {/* The golden thread */}
        <div className="card mb-8 border-green-900/30 bg-green-950/10">
          <h2 className="text-xl font-semibold mb-4">The ecosystem</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            TAG works alongside two companion platforms that carry the enterprise capability and
            driver development work forward:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "TAG",
                role: "Enabling environment",
                desc: "Shapes the conditions for transformation at national and industry level.",
                active: true,
              },
              {
                name: "GreenFreightAcademy",
                role: "Enterprise capability engine",
                desc: "Builds capability across drivers, managers, and transition leaders.",
                href: ECOSYSTEM_URLS.gfa,
              },
              {
                name: "BetterDriver",
                role: "Human resource asset layer",
                desc: "Develops, certifies, and elevates drivers as a professional asset.",
                href: ECOSYSTEM_URLS.betterDriver,
              },
            ].map((platform) => (
              <div
                key={platform.name}
                className={`p-4 rounded-xl border ${
                  platform.active
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border/40 bg-card/50"
                }`}
              >
                <div className="text-xs text-muted-foreground mb-1">{platform.role}</div>
                <div className="font-semibold text-sm mb-2">{platform.name}</div>
                <div className="text-xs text-muted-foreground">{platform.desc}</div>
                {platform.href && (
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    Visit <ChevronRight size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4 mt-12">
          <Link href="/partner-with-tag" className="btn-primary">
            Partner with TAG <ArrowRight size={16} />
          </Link>
          <Link href="/services" className="btn-outline">
            What we do
          </Link>
          <Link href="/contact" className="btn-ghost">
            Start a conversation <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
