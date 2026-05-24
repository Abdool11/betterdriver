import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Green Freight Transformation in South Africa | Transport Action Group",
  description: "Road freight accounts for 9% of South Africa's greenhouse gas emissions. TAG helps fleet operators reduce emissions and improve profitability through green driving, management, and procurement.",
};

const STATS = [
  { value: "±9%", label: "of South Africa's total greenhouse gas emissions come from road freight" },
  { value: "R2.3tn", label: "value of goods moved by road freight annually in South Africa" },
  { value: "350,000+", label: "professional drivers employed in the South African road freight sector" },
  { value: "2050", label: "target year for net-zero emissions under South Africa's NDC commitments" },
];

const BARRIERS = [
  {
    title: "The myth that green costs more",
    body: "Green freight has historically been seen as an expensive add-on — something only large, well-capitalised companies could afford. In practice, the opposite is true. The same actions that reduce emissions — efficient driving, better maintenance, optimised routing, and load management — directly reduce fuel consumption and operating costs. A greener fleet is almost always a more profitable fleet.",
  },
  {
    title: "Poor understanding of what 'green' actually means",
    body: "Many operators assumed that greening a fleet required new technology, new vehicles, or significant capital investment. The reality is that the largest gains come from people and behaviour — how drivers operate vehicles, how managers set targets, and how procurement teams select carriers. Technology amplifies these gains; it does not replace them.",
  },
  {
    title: "The electric truck misconception",
    body: "Even the transition to electric trucks — once considered prohibitively expensive — has reached an inflection point. The total cost of ownership (TCO) per kilometre for electric trucks is now often lower than for equivalent diesel trucks, and the cost curves are divergent: electric freight operations become cheaper over time as battery costs fall and electricity grids decarbonise, while diesel operations face rising fuel costs, carbon pricing, and tightening emissions regulations.",
  },
];

const ENABLERS = [
  {
    title: "Green Driving",
    body: "Driver behaviour is the single largest controllable variable in fleet fuel consumption. Eco-driving techniques — smooth acceleration, anticipatory braking, optimal speed management, and engine idle reduction — consistently deliver 10–15% fuel savings with no capital investment. Trained, certified drivers are the foundation of a green fleet.",
  },
  {
    title: "Green Management",
    body: "Operational improvement starts with measurement. Managers who understand their cost drivers — fuel consumption per kilometre, load factors, route efficiency, maintenance cycles — can set meaningful targets and track progress. Telematics and data analysis turn operational visibility into actionable improvement.",
  },
  {
    title: "Green Transformation",
    body: "Developing action plans towards the implementation of electric trucks is the next frontier of green freight. Total Cost of Ownership (TCO) modelling now shows that in many use cases electric trucks are cheaper to operate on a per-kilometre basis than diesel trucks — and this advantage is expected to grow over time as battery costs continue to fall and diesel fuel costs rise. Early adopters can reduce operational and financial risk by joining structured pilot projects such as the N3 Electric Freight Corridor (N3EFC), which provides a supported pathway to fleet electrification with shared learning, infrastructure access, and risk mitigation.",
  },
  {
    title: "Green Procurement",
    body: "Shippers and cargo owners hold significant leverage. Procurement teams that embed green freight criteria into carrier selection — requiring fuel efficiency data, emissions reporting, and certified driver programmes — shift the entire market. Green procurement is one of the most powerful levers in the system.",
  },
  {
    title: "Green Results",
    body: "We drive efficiency. We drive profit. And we produce lower emissions. These are not competing objectives — they are the same objective. A well-managed, efficiently operated fleet with trained drivers and data-informed management produces better financial results and lower emissions simultaneously.",
  },
];

export default function GreenFreightPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-5xl">
        <div className="mb-16">
          <h1 className="mb-6">The transition we need to make</h1>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-3xl">
            Road freight is the backbone of South Africa's economy — and one of its largest sources of greenhouse gas emissions. Improving efficiency simultaneously increases profitability and decreases emissions. We make your business sustainable — and more profitable.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map(({ value, label }) => (
            <div key={value} className="card p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">{value}</div>
              <div className="text-sm text-muted-foreground leading-snug">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-2">Why this was considered hard</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">Green freight has historically been considered difficult because of a widespread perception that emissions can only be reduced through new technology or significant capital investment. These perceptions were largely unfounded — and the evidence now clearly shows that green freight is more profitable freight.</p>
          <div className="grid gap-4">
            {BARRIERS.map(({ title, body }) => (
              <div key={title} className="card p-6">
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-2">What makes transition possible</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">Understanding your cost drivers and selectively targeting activities that reduce costs — while simultaneously reducing emissions — is the core of green freight transition. It is about people and skills. Green Driving. Green Management. Green Procurement. Green results.</p>
          <div className="grid gap-4">
            {ENABLERS.map(({ title, body }) => (
              <div key={title} className="card p-6">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 mb-8 border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Is an electric truck right for your operation?</h2>
              <p className="text-muted-foreground text-sm max-w-lg">
                Use our TCO calculator to compare the total cost of ownership of electric versus diesel trucks across your specific route profile, monthly kilometres, and fuel costs.
              </p>
            </div>
            <Link href="/tco-calculator" className="btn-primary whitespace-nowrap flex-shrink-0">
              Open TCO Calculator <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold mb-3">TAG's role in the transition</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Building the next generation of road freight networks — with green at the core — requires activation at every layer of the ecosystem. National policy and regulation. Industry partners and stakeholder bodies. Cargo owners and freight buyers. Road freight companies and drivers. Each has a role to play, and not the way it has been for the past 100 years. For new results, we have to change what we are doing. TAG develops and implements strategic action plans that produce results at scale — across companies, industries, and countries.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/services" className="btn-primary">
              See how we work <ArrowRight size={16} />
            </Link>
            <Link href="/partner-with-tag" className="btn-outline">
              Partner with TAG
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
