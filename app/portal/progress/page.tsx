import type { Metadata } from "next";
import ProgressPageClient from "./ProgressPageClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Progress" };

export default function ProgressPage() {
  return <ProgressPageClient />;
}
