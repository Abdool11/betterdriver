import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, BookOpen, BarChart2, Globe } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Knowledge Hub | Transport Action Group",
  description: "Research, reports, and resources on green freight transformation in South Africa.",
};

const CATEGORIES = [
  { icon: BarChart2, label: "Research & Data" },
  { icon: FileText, label: "Policy & Regulation" },
  { icon: BookOpen, label: "Guides & Frameworks" },
  { icon: Globe, label: "International Resources" },
];

const FEATURED = [
  {
    type: "Research Report",
    title: "South Africa Green Freight Baseline Study",
    description: "A comprehensive baseline assessment of emissions, fleet composition, and transition readiness across the South African road freight sector.",
    year: "2024",
    tag: "Research",
  },
  {
    type: "Framework",
    title: "Green Freight Procurement Framework for Shippers",
    description: "A practical framework for South African shippers to embed green freight requirements into procurement and supplier engagement processes.",
    year: "2024",
    tag: "Framework",
  },
  {
    type: "Policy Brief",
    title: "Enabling Policy for Green Freight Transition: Recommendations for South Africa",
    description: "TAG's policy recommendations on emissions standards, incentive mechanisms, and regulatory clarity to accelerate green freight investment.",
    year: "2025",
    tag: "Policy",
  },
  {
    type: "Guide",
    title: "Fleet Electrification Readiness Assessment: A Guide for South African Operators",
    description: "A step-by-step guide for fleet operators to assess their readiness for electric vehicle adoption — covering route analysis, TCO modelling, and infrastructure planning.",
    year: "2025",
    tag: "Guide",
  },
  {
    type: "Data Brief",
    title: "South African Road Freight Emissions Intensity Benchmarks",
    description: "Sector-level emissions intensity benchmarks to help operators understand their performance relative to peers and set credible reduction targets.",
    year: "2025",
    tag: "Data",
  },
  {
    type: "International",
    title: "Global Green Freight Action Programme: South Africa Country Brief",
    description: "South Africa's participation in the Global Green Freight Action Programme — progress, commitments, and next steps.",
    year: "2024",
    tag: "International",
  },
];

export default function KnowledgeHubPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">
        <div className="mb-12">
          <span className="badge mb-4">Knowledge Hub</span>
          <h1 className="mb-6">Research, data, and resources</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            TAG produces and curates research, frameworks, and data resources to inform decision-making across the green freight ecosystem. All publications are freely available.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 mb-12">
          {FEATURED.map(({ type, title, description, year, tag }) => (
            <div key={title} className="card p-6 hover:border-primary/40 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge text-xs">{tag}</span>
                    <span className="text-xs text-muted-foreground">{year}</span>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
                <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Contribute to the knowledge base</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            TAG welcomes research partnerships, data contributions, and collaborative publications from across the ecosystem. If you have research or data that would benefit the sector, we want to hear from you.
          </p>
          <Link href="/contact" className="btn-primary">
            Get in touch <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
