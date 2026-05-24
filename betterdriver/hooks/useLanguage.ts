"use client";

/**
 * useLanguage
 *
 * Reads the `bd_lang` cookie that is set (non-httpOnly) by `createSession`
 * whenever a driver logs in via magic link. Falls back to browser language
 * detection, then English.
 *
 * Returns "en" | "zu" — the two supported languages for BetterDriver.
 */

import { useMemo } from "react";

export type Lang = "en" | "zu";

function getCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)bd_lang=([^;]+)/);
  if (!match) return null;
  const val = match[1];
  if (val === "zu") return "zu";
  if (val === "en") return "en";
  return null;
}

function getBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("zu")) return "zu";
  return "en";
}

export function useLanguage(): Lang {
  return useMemo(() => getCookieLang() ?? getBrowserLang(), []);
}
