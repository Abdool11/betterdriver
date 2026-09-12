import type { Metadata } from "next";
import TasksPageClient from "./TasksPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Tasks | BetterDriver",
  description: "Current learning, CPD and company actions for the signed-in driver.",
};

export default function TasksPage() {
  return <TasksPageClient />;
}
