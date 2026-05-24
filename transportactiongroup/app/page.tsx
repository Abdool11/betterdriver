// DATA REQUIREMENTS:
// - Impact metrics: GET /api/metrics → TagMetrics (see types/index.ts)
//   Fields: action_plans, workshops, partners, countries, last_updated, data_source
//   Fallback: IMPACT_STRIP_FALLBACK from lib/constants.ts
// All other content is static from lib/constants.ts

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Zap,
  Users,
  BookOpen,
  Globe,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Shield,
  Target,
  Layers,
} from "lucide-react";
import {
  HERO,
  WHAT_TAG_DOES,
  WHO_TAG_WORKS_WITH,
  WHY_THIS_MATTERS,
  IMPACT_STRIP_FALLBACK,
  ECOSYSTEM_SECTION,
} from "@/lib/constants";
import { fetchGfaStats } from "@/components/LiveGfaStats";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Transport Action Group | Enabling Green Freight Transformation",
  description:
    "Creating the enabling environment for green freight transformation through action plans, strategic interventions, ecosystem alignment, and partner mobilisation.",
};

const ICON_MAP: Record<string, React.ElementType> = {
  MapPin,
  Zap,
  Users,
  ArrowRight,
  BookOpen,
  Globe,
  TrendingUp,
  Shield,
  Target,
  Layers,
};

// ─── Books (primary intellectual capital) ────────────────────────────────────
const BOOKS = [
  {
    id: "ptdh",
    title: "The Professional Truck Driver's Handbook",
    category: "Driver Development",
    description:
      "A comprehensive foundation for professional truck drivers — covering safety, compliance, eco-driving, and the standards that define a credible, certified professional.",
    href: "/books",
  },
  {
    id: "rfs4",
    title: "Road Freight Sustainability 4.0",
    category: "Green Freight",
    description:
      "A practical guide to building a sustainable road freight operation — integrating efficiency, emissions management, and profitability into a coherent transformation strategy.",
    href: "/books",
  },
  {
    id: "dpwp",
    title: "Driving Profit with Power",
    category: "Electric Truck",
    description:
      "A strategic and operational guide to electric truck transition — covering total cost of ownership, infrastructure readiness, fleet planning, and the business case for electrification.",
    href: "/books",
  },
];

// ─── Conference Papers and Articles ──────────────────────────────────────────
const PAPERS = [
  {
    id: "evia2018",
    title: "Decarbonisation of Road Freight: Electrification of Heavy Vehicles",
    venue: "EVIA, Expert's Opinion",
    year: "2018",
    summary:
      "An early published article examining the role of electric heavy vehicles in freight decarbonisation, including transition constraints, infrastructure questions, and the long-term logic of electrification in road freight.",
  },
  {
    id: "rtms2017",
    title: "Perceptions of the Road Transport Management System (RTMS): Promoting Voluntary Certification",
    venue: "SATC Conference Paper",
    year: "2017",
    summary:
      "Examining stakeholder perceptions of RTMS and the role of voluntary certification in improving safety, compliance, and operational performance.",
  },
  {
    id: "kers2017",
    title: "Ultracapacitor Kinetic Energy Recovery Systems in Road Transport Vehicles: Is it a Viable Retrofit Option for Reducing Fuel Consumption and CO₂ Emissions?",
    venue: "SATC Conference Paper",
    year: "2017",
    summary:
      "Exploring retrofit energy-recovery options for reducing fuel consumption and CO₂ emissions in road transport operations.",
  },
  {
    id: "ieom2018",
    title: "Operational Improvement Outcomes through Voluntary Compliance in Road Transport Operations",
    venue: "IEOM Conference Proceedings",
    year: "2018",
    summary:
      "Focused on operational improvement and voluntary compliance in road transport operations.",
  },
];

export default async function HomePage() {
  const metrics = IMPACT_STRIP_FALLBACK;
  const gfaStats = await fetchGfaStats();

  return (
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[75vh] flex items-center pt-28 overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="glow-blob glow-blob-green"
            style={{ width: "70vw", height: "70vh", top: "-20%", left: "15%" }}
          />
          <div
            className="glow-blob glow-blob-teal"
            style={{ width: "50vw", height: "50vh", bottom: "0", right: "-10%" }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container relative z-10 py-12">
          <div className="max-w-4xl">
            {/* Headline */}
            <h1 className="mb-6 text-foreground">
              <span className="block text-foreground">Creating the enabling environment for</span>
              <span className="block gradient-text">Green Freight Transformation</span>
            </h1>

            {/* Supporting text */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              {HERO.supporting}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-4">
              <Link href={HERO.ctaPrimary.href} className="btn-primary">
                {HERO.ctaPrimary.label}
                <ArrowRight size={16} />
              </Link>
              <Link href={HERO.ctaSecondary.href} className="btn-outline">
                {HERO.ctaSecondary.label}
              </Link>
              <Link href={HERO.ctaTertiary.href} className="btn-ghost">
                {HERO.ctaTertiary.label}
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — IMPACT STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-border/60 bg-card/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: metrics.workshops, label: "Strategic Workshops", suffix: "+" },
              { value: gfaStats.drivers, label: "Training Seats Booked", suffix: "" },
              { value: gfaStats.certificates, label: "Certifications Completed", suffix: "" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-4xl font-bold gradient-text mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — WHAT WE DO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section bg-card/30">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <h2 className="mb-4">What we do</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              TAG is a strategic advisory with national and trans-national implementation capability. We work across the full spectrum of green freight transformation — from shaping policy and convening stakeholders to deploying capability programmes and measuring impact at scale, across companies, industries, and countries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_TAG_DOES.pillars.map((pillar) => {
              const Icon = ICON_MAP[pillar.icon] ?? Globe;
              return (
                <Link key={pillar.title} href={pillar.href} className="card group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-green-400" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 group-hover:text-green-400 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — WHO TAG WORKS WITH
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <h2 className="mb-4">{WHO_TAG_WORKS_WITH.heading}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHO_TAG_WORKS_WITH.audiences.map((audience) => (
              <div key={audience.title} className="card flex flex-col">
                <h3 className="text-base font-semibold mb-2">{audience.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {audience.description}
                </p>
                <Link
                  href={audience.href}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
                >
                  {audience.cta} <ChevronRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5 — WHY THIS MATTERS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-br from-navy-800 to-navy-900 border-y border-border/40">
        <div className="container">
          <div className="max-w-3xl mb-10">
            <span className="badge badge-teal mb-4">Why This Matters</span>
            <h2 className="mb-4">{WHY_THIS_MATTERS.heading}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {WHY_THIS_MATTERS.copy}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_THIS_MATTERS.benefits.map((benefit) => (
              <div
                key={benefit.label}
                className="flex items-start gap-4 p-5 rounded-xl bg-white/3 border border-border/40"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-teal-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">{benefit.label}</div>
                  <div className="text-xs text-muted-foreground">{benefit.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6 — ACTION PLAN PATHWAYS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Green Freight Action Plan */}
            <div className="card group">
              <h3 className="mb-3">Green Freight Action Plan</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                A structured, practical framework to guide national and industry-level green freight
                transformation — from stakeholder alignment and baseline assessment through to
                implementation roadmap and monitoring.
              </p>
              <Link
                href="/green-freight"
                className="inline-flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                Explore the pathway <ArrowRight size={14} />
              </Link>
            </div>

            {/* Electric Truck Action Plan */}
            <div className="card group">
              <h3 className="mb-3">Electric Truck Action Plan</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                A strategic roadmap to support zero-emission truck transition — addressing
                infrastructure, total cost of ownership, fleet readiness, and corridor-level
                implementation across the freight network.
              </p>
              <Link
                href="/electric-truck"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
              >
                Explore the pathway <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7 — PUBLICATIONS
          Books are primary. Conference papers are a credibility layer beneath.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section bg-card/30">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div className="max-w-2xl">
              <span className="badge mb-4">Books and Frameworks</span>
              <h2 className="mb-3">Practical guidance for implementation</h2>
              <p className="text-muted-foreground text-base">
                TAG publications serve as working guides for practitioners, industry bodies, and
                decision-makers navigating green freight transformation.
              </p>
            </div>
            <Link
              href="/books"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors flex-shrink-0"
            >
              View all publications <ArrowRight size={14} />
            </Link>
          </div>

          {/* Books — primary */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {BOOKS.map((book) => (
              <Link key={book.id} href={book.href} className="card group cursor-pointer">
                <span className="badge badge-teal text-xs mb-4">{book.category}</span>
                <h4 className="text-sm font-semibold mb-2 group-hover:text-green-400 transition-colors leading-snug">
                  {book.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Conference papers — credibility layer */}
          <div className="border-t border-border/40 pt-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Selected publications and conference papers
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {PAPERS.map((paper) => (
                <div
                  key={paper.id}
                  className="flex gap-4 p-4 rounded-xl bg-white/2 border border-border/30"
                >
                  <div className="flex-shrink-0 text-right min-w-[3rem]">
                    <span className="text-xs font-mono text-muted-foreground">{paper.year}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-snug mb-1">
                      {paper.title}
                    </p>
                    <p className="text-xs text-green-500/70 mb-2">{paper.venue}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {paper.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8 — ECOSYSTEM
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="max-w-3xl mb-8">
            <span className="badge badge-blue mb-4">The Ecosystem</span>
            <h2 className="mb-4">{ECOSYSTEM_SECTION.heading}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {ECOSYSTEM_SECTION.supporting}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {ECOSYSTEM_SECTION.platforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.href}
                target={platform.external ? "_blank" : undefined}
                rel={platform.external ? "noopener noreferrer" : undefined}
                className="card group cursor-pointer"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {platform.role}
                </div>
                <h3 className="text-base font-semibold mb-2 group-hover:text-green-400 transition-colors">
                  {platform.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {platform.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit platform <ArrowRight size={12} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section bg-gradient-to-br from-navy-800 via-navy-900 to-background border-t border-border/40">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="mb-4">
              Partner to help shape the future of{" "}
              <span className="gradient-text">green freight</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              Whether you are a DFI looking for credible investment platforms, an industry body
              seeking structured transformation support, or an ecosystem collaborator ready to
              align — TAG is the convening platform for green freight transformation.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/partner-with-tag" className="btn-primary">
                Partner with TAG
                <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-outline">
                Explore our work
              </Link>
              <Link href="/contact" className="btn-ghost">
                Start a conversation
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
