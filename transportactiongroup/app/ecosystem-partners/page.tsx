import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Globe, Users, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Ecosystem Partners | Transport Action Group",
  description: "TAG invites engagement from development finance institutions, donors, industry bodies, and shipper councils committed to green freight transformation in South Africa.",
};

const PARTNER_TYPES = [
  {
    icon: Building2,
    title: "Development Finance Institutions",
    description:
      "DFIs provide the concessional capital and technical assistance that makes first-mover fleet transitions financially viable. TAG works with DFIs to design blended finance instruments and identify investable pipeline.",
    invitation:
      "We invite DFIs with an interest in green freight, transport decarbonisation, or blended finance for emerging markets to explore how we can work together to build investable pipeline and deploy capital effectively.",
  },
  {
    icon: Globe,
    title: "Donors and International Funders",
    description:
      "International donors fund the enabling environment work — research, policy engagement, standards development, and capacity building — that creates the conditions for private investment to follow.",
    invitation:
      "We invite donors and international funders focused on climate, transport, or sustainable development to engage with TAG on the enabling environment work that unlocks private sector action at scale.",
  },
  {
    icon: TrendingUp,
    title: "Industry Bodies and Associations",
    description:
      "Industry bodies represent the collective voice of operators, shippers, and service providers. TAG works with industry bodies to build sector-wide commitment to green freight standards and practices.",
    invitation:
      "We invite industry bodies and associations to partner with TAG in building the standards, frameworks, and sector commitments that give individual operators the confidence to act.",
  },
  {
    icon: Users,
    title: "Shipper Councils and Cargo Owners",
    description:
      "Shippers who commit to green freight procurement are the most powerful lever in the system. TAG engages shipper councils to build demand-side commitment that creates market signals for carriers to invest.",
    invitation:
      "We invite shipper councils and cargo owners to work with TAG on green freight procurement frameworks that create the demand-side signals the market needs to move.",
  },
];

const ENGAGEMENT_AREAS = [
  "Green freight policy and regulatory frameworks",
  "Blended finance instrument design",
  "Fleet transition programme development",
  "Emissions measurement and reporting standards",
  "Driver and management capability development",
  "Shipper-carrier alignment and procurement standards",
  "International knowledge exchange and reporting",
  "Research and evidence generation",
];

export default function EcosystemPartnersPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">

        <div className="mb-16">
          <h1 className="mb-6">Ecosystem Partners</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            Green freight transformation is a collective endeavour. TAG works with a diverse coalition of partners — from development finance institutions and international donors to industry bodies and shipper councils — to create the coordinated action that no single actor can generate alone.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl mt-4">
            We actively invite engagement from organisations across each part of the ecosystem. If you are serious about green freight transformation, we want to work with you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {PARTNER_TYPES.map(({ icon: Icon, title, description, invitation }) => (
            <div key={title} className="card p-6 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              </div>
              <div className="border-t border-border/40 pt-4">
                <p className="text-sm text-primary/80 leading-relaxed italic">{invitation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8 mb-12">
          <h2 className="text-xl font-semibold mb-6">Areas of ecosystem engagement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ENGAGEMENT_AREAS.map(area => (
              <div key={area} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {area}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Start a conversation</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Whether you are a funder, an industry body, a shipper, or a public-sector institution — if you are serious about green freight transformation in South Africa or across the region, we want to hear from you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
              Get in touch <ArrowRight size={16} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
