import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Electric Truck TCO Calculator",
  description:
    "Compare the total cost of ownership of electric trucks versus diesel trucks in South Africa. Input your fleet's operational parameters to calculate payback period, fuel savings, and lifetime cost difference.",
  keywords: [
    "TCO calculator electric truck",
    "total cost of ownership electric truck South Africa",
    "diesel vs electric truck cost comparison",
    "electric truck ROI South Africa",
    "EV truck payback period",
    "fleet electrification cost",
    "electric truck fuel savings",
  ],
  openGraph: {
    title: "Electric Truck TCO Calculator | Transport Action Group",
    description:
      "Calculate the total cost of ownership of electric trucks versus diesel. Compare fuel savings, maintenance costs, and payback period for your South African fleet.",
    url: "https://www.transportactiongroup.com/tco-calculator",
  },
  alternates: {
    canonical: "https://www.transportactiongroup.com/tco-calculator",
  },
};

import TCOCalculatorPageClient from "./TCOCalculatorPageClient";

export default function TCOCalculatorPagePage() {
  return <TCOCalculatorPageClient />;
}
