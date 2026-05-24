import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Users, FileText, Globe, Lightbulb, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "What We Do | Transport Action Group",
  description: "How Transport Action Group turns green freight ambition into practical, coordinated action at national and trans-national scale — through action plans, strategic workshops, and implementation support.",
};

const SERVICES = [
  {
    icon: Target,
    title: "Strategic Advisory",
    description: "We work alongside DFIs, donors, public-sector bodies, and industry leaders to design enabling frameworks that move green freight from policy intent to practical implementation. Our advisory engagements are grounded in deep transport expertise — we understand trucks, drivers, and the operational realities of South African road freight.",
    outcomes: ["Policy and regulatory pathway analysis", "Green freight transition roadmaps", "Stakeholder alignment and consensus-building", "Investment readiness assessments"],
  },
  {
    icon: Users,
    title: "Ecosystem Coordination",
    description: "Green freight transformation requires coordinated action across shippers, carriers, financiers, regulators, and training providers. TAG convenes and facilitates these relationships — creating the conditions for aligned investment, shared standards, and collective momentum that no single actor can generate alone.",
    outcomes: ["Multi-stakeholder working groups", "Shipper-carrier alignment programmes", "Industry body engagement", "Cross-sector coalition building"],
  },
  {
    icon: TrendingUp,
    title: "Implementation Support",
    description: "Strategy without implementation is just a document. TAG provides hands-on support to translate green freight commitments into operational programmes — from fleet transition planning to driver capability development to monitoring and reporting frameworks.",
    outcomes: ["Fleet transition planning and phasing", "Supplier and technology market facilitation", "Programme design and management", "Impact measurement and reporting"],
  },
  {
    icon: FileText,
    title: "Research and Evidence",
    description: "We produce rigorous, practical research that informs decision-making across the ecosystem. Our work bridges the gap between academic analysis and operational reality — providing the evidence base that funders, policymakers, and industry leaders need to act with confidence.",
    outcomes: ["Sector baseline studies and benchmarking", "Technology and market assessments", "Cost-benefit and business case analysis", "Monitoring, evaluation, and learning frameworks"],
  },
  {
    icon: Lightbulb,
    title: "Capability Development",
    description: "Through our GreenFreightAcademy and BetterDriver platforms, TAG delivers scalable capability development across the freight enterprise — from management and sustainability leads to professional drivers. We build the human capital that makes green freight transformation durable.",
    outcomes: ["Company-level training programmes via www.GreenFreightAcademy.co.za", "Professional Truck Driver Training via www.BetterDriver.co.za", "Customised learning pathways", "Cohort-based deployment at scale"],
  },
  {
    icon: Globe,
    title: "International Engagement",
    description: "South Africa's green freight transition does not happen in isolation. TAG connects the domestic ecosystem to international knowledge networks, funding mechanisms, and standards bodies — ensuring that local programmes benefit from global learning and that South African progress contributes to the global agenda.",
    outcomes: ["International donor and DFI engagement", "Global standards alignment", "South-South knowledge exchange", "Reporting to international frameworks"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">
        <div className="mb-16">
          <h1 className="mb-6">From ambition to implementation</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            TAG is a strategic advisory with national-scale implementation capability. We work across the full spectrum of green freight transformation — from shaping policy and convening stakeholders to deploying capability programmes and measuring impact.
          </p>
        </div>

        <div className="grid gap-8 mb-16">
          {SERVICES.map(({ icon: Icon, title, description, outcomes }) => (
            <div key={title} className="card p-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-3">{title}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-5">{description}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {outcomes.map(o => (
                      <li key={o} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to work together?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Whether you are a funder looking to deploy capital, a public-sector body designing a transition framework, or an industry leader seeking a credible implementation partner — we want to hear from you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partner-with-tag" className="btn-primary">
              Start a partnership conversation <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="btn-outline">
              Get in touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
