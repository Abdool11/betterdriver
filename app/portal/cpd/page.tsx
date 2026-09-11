import type { Metadata } from "next";
import CpdPageClient from "./CpdPageClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CPD & Refresh" };

export default function CpdPage() {
  return <CpdPageClient />;
}
