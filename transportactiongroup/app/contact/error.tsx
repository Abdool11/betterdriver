"use client";
import Link from "next/link";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-20">
      <div className="text-center max-w-sm px-6">
        <h2 className="text-lg font-semibold mb-3">Something went wrong</h2>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary text-sm">Try again</button>
          <Link href="/" className="btn-outline text-sm">Go home</Link>
        </div>
      </div>
    </div>
  );
}
