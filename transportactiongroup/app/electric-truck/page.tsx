import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Route, DollarSign, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Zero-Emission Trucks in Africa | Transport Action Group",
  description: "A practical guide to battery electric truck technology, readiness, and transition planning for African road freight operators.",
};

const KEY_VARIABLES = [
  "Monthly kilometres travelled",
  "Route and duty-cycle profile",
  "Battery size and operational fit",
  "Direct charging versus battery swapping",
  "Uptime and turnaround requirements",
  "Delivery-slot adherence",
  "Wider truck-battery-charging ecosystem design",
];

const CONSIDERATIONS = [
  {
    icon: Route,
    title: "Route and duty cycle analysis",
    body: "The commercial case for battery electric trucks depends on the relationship between route profile, duty cycle, battery size, and monthly kilometres travelled. High-utilisation, longer-distance operations often present the strongest financial logic — the higher capital cost amortises more effectively and the energy-cost advantage accumulates most strongly over time.",
  },
  {
    icon: DollarSign,
    title: "Total cost of ownership",
    body: "TCO per kilometre for electric trucks is now often lower than for equivalent diesel trucks in high-utilisation operations. The cost curves are divergent: electric freight operations become cheaper over time as battery costs fall, while diesel operations face rising fuel costs, carbon pricing, and tightening emissions regulations.",
  },
  {
    icon: Zap,
    title: "Charging pathway and uptime",
    body: "Whether direct charging or battery swapping better protects uptime, turnaround performance, and delivery-slot adherence is a critical operational question. South Africa's grid constraints require careful assessment of depot capacity, backup power, and charging scheduling before committing to electrification.",
  },
  {
    icon: Wrench,
    title: "Technician capability",
    body: "Electric drivetrains require different maintenance skills and tooling. Operators transitioning to electric fleets need to invest in technician training and workshop equipment — or partner with OEM service networks.",
  },
];

const MARKET = [
  { oem: "Volvo", models: "FH Electric, FM Electric", range: "Up to 300 km", status: "Available in SA" },
  { oem: "Mercedes-Benz", models: "eActros 300, eActros 600", range: "Up to 500 km", status: "Available in SA" },
  { oem: "Scania", models: "P-series rigid, R 400E tractor", range: "250–350 km", status: "Available in SA" },
  { oem: "SANY", models: "EV350, EV490, EV650 (tractors); FR601, FR1601, FR2501 (rigids)", range: "200–400 km (model dependent)", status: "Available in SA" },
];

export default function ElectricTruckPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">

        {/* Header */}
        <div className="mb-16">
          <h1 className="mb-6">Zero-emission trucks in Africa</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            Battery electric trucks are commercially available, increasingly cost-competitive, and being deployed by leading operators globally. Here is what African fleet operators need to know.
          </p>
        </div>

        {/* Why Battery Electric Trucks Matter */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Why Battery Electric Trucks Matter</h2>
          <div className="space-y-5 text-muted-foreground leading-relaxed mb-8 max-w-3xl">
            <p>
              Battery electric trucks are the primary focus of TAG's work in this area because there is a strong and credible evidence base supporting them as the leading zero-emissions solution for road freight.
            </p>
            <p>
              Historically, electric trucks were often seen mainly as urban, short-haul, or last-mile vehicles. That framing is now too narrow. In practice, some of the strongest commercial and environmental logic emerges in longer-distance, high-utilisation operations, where vehicles travel high monthly kilometres, the higher capital cost can be amortised more effectively, and the energy-cost advantage can accumulate most strongly over time.
            </p>
            <p>
              The practical question is therefore not whether battery electric trucks matter, but under what operating conditions they create the greatest value. That depends on the relationship between route profile, duty cycle, battery size, monthly kilometres travelled, charging pathway, and service requirements. It also depends on whether direct charging or battery swapping better protects uptime, turnaround performance, and delivery-slot adherence.
            </p>
            <p>
              TAG's role is to help frame these questions properly and support the operational and commercial logic needed to make electric truck deployment more competitive, more reliable, and more effective in real freight conditions.
            </p>
          </div>

          {/* Key decision variables */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Key decision variables
            </h3>
            <ul className="grid sm:grid-cols-2 gap-2">
              {KEY_VARIABLES.map((v) => (
                <li key={v} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key considerations */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Key considerations for South African operators</h2>
          <div className="grid gap-4">
            {CONSIDERATIONS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OEM market overview */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">OEM market overview</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">OEM</th>
                  <th className="text-left p-4 font-semibold">Models</th>
                  <th className="text-left p-4 font-semibold">Range</th>
                  <th className="text-left p-4 font-semibold">SA Status</th>
                </tr>
              </thead>
              <tbody>
                {MARKET.map(({ oem, models, range, status }) => (
                  <tr key={oem} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{oem}</td>
                    <td className="p-4 text-muted-foreground">{models}</td>
                    <td className="p-4 text-muted-foreground">{range}</td>
                    <td className="p-4"><span className="badge text-xs">{status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Range figures are indicative and vary by load, terrain, and conditions. Data current as of 2025.
          </p>
        </div>

        {/* CTA */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold mb-3">Planning your fleet transition</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            TAG provides fleet transition advisory services — from route and duty cycle analysis to TCO modelling to OEM engagement support. If you are considering electrification or want to understand your options, we can help.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/partner-with-tag" className="btn-primary">
              Talk to TAG about fleet transition <ArrowRight size={16} />
            </Link>
            <Link href="/green-freight" className="btn-outline">
              Green freight overview
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
