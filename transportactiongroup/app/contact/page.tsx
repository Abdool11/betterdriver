import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Transport Action Group",
  description:
    "Get in touch with Transport Action Group to discuss green freight action plans, electric truck transition strategies, ecosystem partnerships, or strategic advisory engagements for your organisation or industry body.",
  keywords: [
    "contact Transport Action Group",
    "green freight advisory South Africa",
    "green freight consultation",
    "electric truck strategy South Africa",
    "TAG contact",
  ],
  openGraph: {
    title: "Contact Transport Action Group",
    description:
      "Start a conversation with TAG about green freight transformation, electric truck transition, or ecosystem partnership opportunities.",
    url: "https://www.transportactiongroup.com/contact",
  },
  alternates: {
    canonical: "https://www.transportactiongroup.com/contact",
  },
};

import ContactPageClient from "./ContactPageClient";

export default function ContactPagePage() {
  return <ContactPageClient />;
}
