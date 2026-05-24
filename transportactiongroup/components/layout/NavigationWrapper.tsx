"use client";
import dynamic from "next/dynamic";

const Navigation = dynamic(() => import("./Navigation").then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => <div className="h-20" />,
});

export { Navigation };
