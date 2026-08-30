"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

/**
 * Registers the PWA service worker and exposes the install affordance only
 * after a driver has entered the portal. Public marketing and activation pages
 * must not interrupt the access journey with an installation prompt.
 */
export default function PwaInstaller() {
  const pathname = usePathname();
  const isPortalRoute = pathname?.startsWith("/portal");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isPortalRoute) {
      setInstallPrompt(null);
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // PWA registration is optional and must never block portal access.
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [isPortalRoute]);

  if (!isPortalRoute || !installPrompt) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await installPrompt.prompt();
        setInstallPrompt(null);
      }}
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 99,
        background: "#14b8a6",
        color: "#06283b",
        border: 0,
        borderRadius: 999,
        padding: "11px 16px",
        fontWeight: 800,
        boxShadow: "0 6px 20px #0005",
      }}
    >
      Install BetterDriver
    </button>
  );
}
