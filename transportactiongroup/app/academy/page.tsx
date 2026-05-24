import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, BookOpen, Users, Award, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "GreenFreightAcademy | Transport Action Group",
  description: "TAG's capability development platform for road freight companies — scalable training, certification, and performance improvement.",
};

const FEATURES = [
  { icon: BookOpen, title: "Six specialist programmes", body: "From professional driver certification to management training to green freight procurement — GFA delivers structured learning pathways for every role in the freight enterprise." },
  { icon: Users, title: "Company-level deployment", body: "GFA is designed for fleet operators and freight companies. Upload your driver list, select programmes, and deploy training to your entire workforce in a single workflow." },
  { icon: Award, title: "Nationally recognised certification", body: "All GFA programmes lead to certification that is recognised across the South African freight sector. Drivers and managers build a visible, verifiable record of professional development." },
  { icon: TrendingUp, title: "Performance-linked outcomes", body: "GFA programmes are designed around measurable business outcomes — fuel efficiency, safety performance, compliance, and emissions reduction — not just learning completion." },
];

// PRICING_STUB: Asif — replace GFA_PRICING_API_URL with the live GFA /api/pricing endpoint
// e.g. https://greenfreightacademy.co.za/api/pricing
const GFA_PRICING_API_URL = process.env.GFA_PRICING_API_URL ?? "";

interface Programme {
  name: string;
  audience: string;
  type: string;
  price: string;
}

async function fetchProgrammePricing(): Promise<Programme[]> {
  const FALLBACK: Programme[] = [
    { name: "Professional Truck Driver", audience: "Drivers", type: "Subscription", price: "R35/month" },
    { name: "Eco-Driver Certification", audience: "Drivers", type: "Subscription", price: "R35/month" },
    { name: "Introduction to Green Freight", audience: "Management", type: "Once-off", price: "R1,000" },
    { name: "Road Freight Manager", audience: "Management", type: "Once-off", price: "R5,000" },
    { name: "Electric Truck Transformation", audience: "Specialist", type: "Once-off", price: "R5,000" },
    { name: "Green Freight Procurement", audience: "Specialist", type: "Once-off", price: "R5,000" },
  ];
  if (!GFA_PRICING_API_URL) return FALLBACK;
  try {
    const res = await fetch(GFA_PRICING_API_URL, { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    return Array.isArray(data.programmes) ? data.programmes : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export default async function AcademyPage() {
  const PROGRAMMES = await fetchProgrammePricing();
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">
        <div className="mb-16">
          <img src="/gfa-logo.png" alt="GreenFreightAcademy" className="h-12 w-auto mb-4" />
          <h1 className="mb-6">Capability development at scale</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            GreenFreightAcademy is TAG's capability and performance platform for road freight companies. It delivers scalable, structured training that improves business performance through people development — built by transport experts who understand trucks, drivers, and trucking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Available programmes</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Programme</th>
                  <th className="text-left p-4 font-semibold">Audience</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMMES.map(({ name, audience, type, price }) => (
                  <tr key={name} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{name}</td>
                    <td className="p-4 text-muted-foreground">{audience}</td>
                    <td className="p-4 text-muted-foreground">{type}</td>
                    <td className="p-4 text-primary font-medium">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-8">
          <img src="/gfa-logo.png" alt="GreenFreightAcademy" className="h-10 w-auto mb-3" />
          <p className="text-muted-foreground leading-relaxed mb-6">
            GreenFreightAcademy is a standalone platform with its own company portal, driver management dashboard, and enrolment workflow. Visit the GFA site to register your company, upload your driver list, and deploy training.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="https://greenfreightacademy.co.za" target="_blank" rel="noopener noreferrer" className="btn-primary">
              <img src="/gfa-logo.png" alt="GFA" className="h-5 w-auto" /> Visit GreenFreightAcademy <ExternalLink size={16} />
            </a>
            <Link href="/contact" className="btn-outline">
              Talk to TAG about training
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
