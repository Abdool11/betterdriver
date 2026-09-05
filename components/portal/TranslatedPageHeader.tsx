"use client";

/**
 * TranslatedPageHeader
 *
 * A thin client component used by all portal server pages to render
 * a translated heading and subtitle. Reads language from the bd_lang cookie.
 *
 * Usage:
 *   <TranslatedPageHeader pageKey="tasks" driverFirstName="Sipho" />
 */

import { useLanguage, type Lang } from "@/hooks/useLanguage";

type PageKey =
  | "tasks"
  | "progress"
  | "certificate"
  | "cpd"
  | "support"
  | "profile"
  | "bulletins"
  | "learning";

const PAGE_COPY: Record<PageKey, Record<Lang, { title: string; sub: string | ((name: string) => string) }>> = {
  tasks: {
    en: {
      title: "My Tasks",
      sub: (name: string) => `Good morning, ${name}. Here is what needs your attention today.`,
    },
    zu: {
      title: "Imisebenzi Yami",
      sub: (name: string) => `Sawubona, ${name}. Nansi imisebenzi edinga ukunakwa kwakho namuhla.`,
    },
  },
  progress: {
    en: { title: "My Progress", sub: "Your training journey so far." },
    zu: { title: "Inqubekela Phambili Yami", sub: "Uhambo lwakho lokuqeqesha kuze kube manje." },
  },
  certificate: {
    en: { title: "My Certificate", sub: "Your recognised professional certification." },
    zu: { title: "Isitifiketi Sami", sub: "Isitifiketi sakho sobuchwepheshe esivunyiwe." },
  },
  cpd: {
    en: { title: "CPD & Refresh", sub: "Your continuing professional development record." },
    zu: { title: "Ukuqeqesha Okuqhubekayo", sub: "Irekhodi lakho lokuthuthukisa ubuchwepheshe obuqhubekayo." },
  },
  support: {
    en: { title: "Support", sub: "We are here to help." },
    zu: { title: "Usizo", sub: "Silapha ukukusiza." },
  },
  profile: {
    en: { title: "My Profile", sub: "Keep your details up to date." },
    zu: { title: "Iphrofayeli Yami", sub: "Gcina imininingwane yakho ibuyekeziwe." },
  },
  bulletins: {
    en: { title: "Bulletins", sub: "Updates and notices from your company." },
    zu: { title: "Izaziso", sub: "Izibuyekezo nezaziso evela enkampanini yakho." },
  },
  learning: {
    en: { title: "My Course", sub: "Your training programme and modules." },
    zu: { title: "Ikhosi Yami", sub: "Uhlelo lwakho lokuqeqesha nezifundo." },
  },
};

interface Props {
  pageKey: PageKey;
  driverFirstName?: string;
  style?: React.CSSProperties;
}

export default function TranslatedPageHeader({ pageKey, driverFirstName = "", style }: Props) {
  const lang = useLanguage();
  const entry = PAGE_COPY[pageKey][lang];
  const title = entry.title;
  const sub = typeof entry.sub === "function" ? entry.sub(driverFirstName) : entry.sub;

  return (
    <div style={{ marginBottom: "2rem", ...style }}>
      <h1
        style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontWeight: 800,
          fontSize: "1.75rem",
          color: "#F9FAFB",
          margin: "0 0 0.375rem",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "#9CA3AF", margin: 0 }}>{sub}</p>
    </div>
  );
}
