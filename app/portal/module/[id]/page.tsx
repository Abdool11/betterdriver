import type { Metadata } from "next";
import ModulePageClient from "./ModulePageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning Module | BetterDriver",
  description: "Open an assigned BetterDriver learning module.",
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModulePageClient moduleId={id} />;
}
