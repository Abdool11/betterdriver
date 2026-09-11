import type { Metadata } from "next";
import CoursePageClient from "./CoursePageClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Programme | BetterDriver",
  description: "Track your progress through your assigned BetterDriver programme.",
};

export default function CoursePage() {
  return <CoursePageClient />;
}
