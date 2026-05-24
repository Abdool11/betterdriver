export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="font-display text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go home <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="btn-outline">
            Contact TAG
          </Link>
        </div>
      </div>
    </div>
  );
}
