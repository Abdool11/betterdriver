"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Asif to implement — log error to monitoring service (e.g. Sentry)
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-lg">!</span>
        </div>
        <h2 className="text-xl font-semibold mb-3">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-8">
          An unexpected error occurred. Please try again, or return to the homepage.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm">
            Try again
          </button>
          <Link href="/" className="btn-outline text-sm">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
