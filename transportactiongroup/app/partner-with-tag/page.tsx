import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner with Transport Action Group",
  description:
    "Partner with Transport Action Group to accelerate green freight transformation in South Africa and Africa. We work with DFIs, industry bodies, technology providers, and ecosystem partners to create the enabling conditions for sustainable road freight.",
  keywords: [
    "partner with Transport Action Group",
    "green freight partnership South Africa",
    "DFI green freight Africa",
    "sustainable logistics partnership",
    "freight decarbonisation partner",
    "green freight ecosystem",
    "road freight transformation partner",
  ],
  openGraph: {
    title: "Partner with Transport Action Group | Green Freight Transformation",
    description:
      "Join the TAG ecosystem. We partner with DFIs, industry bodies, and technology providers to accelerate green freight transformation across South Africa and Africa.",
    url: "https://www.transportactiongroup.com/partner-with-tag",
  },
  alternates: {
    canonical: "https://www.transportactiongroup.com/partner-with-tag",
  },
};

import PartnerWithTagPageClient from "./PartnerWithTagPageClient";

export default function PartnerWithTagPagePage() {
  return <PartnerWithTagPageClient />;
}
