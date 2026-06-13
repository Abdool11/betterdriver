"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlayCircle,
  RefreshCw,
  Award,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ChevronRight,
  Wifi,
  Download,
  Bell,
} from "lucide-react";
import { useLanguage, type Lang } from "@/hooks/useLanguage";

interface DriverStats {
  firstName: string;
  lastName: string;
  programmeTitle: string;
  progressPercent: number;
  completedModules: number;
  totalModules: number;
  cpdDue: boolean;
  certificateReady: boolean;
  unreadBulletins: number;
}

const DEMO_STATS: DriverStats = {
  firstName: "Demo",
  lastName: "Driver",
  programmeTitle: "Driver University Programme",
  progressPercent: 42,
  completedModules: 5,
  totalModules: 12,
  cpdDue: true,
  certificateReady: false,
  unreadBulletins: 2,
};

const COPY: Record<Lang, {
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  loading: string;
  modulesOf: (done: number, total: number) => string;
  quickActions: string;
  continueTrain: string;
  continueTrainSub: string;
  cpdRefresh: string;
  cpdDue: string;
  cpdOk: string;
  viewCert: string;
  certReady: string;
  certPending: string;
  getHelp: string;
  getHelpSub: string;
  wifiTitle: string;
  wifiSub: string;
  wifiCta: string;
  bulletinSingle: (n: number) => string;
  bulletinSub: string;
  myProfile: string;
  myCv: string;
  myCvSub: string;
  myRecord: string;
  myRecordSub: string;
  profileSettings: string;
  profileSettingsSub: string;
}> = {
  en: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    loading: "Loading…",
    modulesOf: (done, total) => `${done} of ${total} modules completed`,
    quickActions: "Quick actions",
    continueTrain: "Continue Training",
    continueTrainSub: "Pick up where you left off",
    cpdRefresh: "CPD Refresh",
    cpdDue: "New module available",
    cpdOk: "Up to date",
    viewCert: "View Certificate",
    certReady: "Ready to download",
    certPending: "Complete training first",
    getHelp: "Get Help",
    getHelpSub: "Support & FAQs",
    wifiTitle: "Save data — download on WiFi",
    wifiSub: "Download your course material while on WiFi so you can study anywhere without using mobile data.",
    wifiCta: "Download course material",
    bulletinSingle: (n) => `${n} unread bulletin${n > 1 ? "s" : ""}`,
    bulletinSub: "Important updates from your company",
    myProfile: "My profile",
    myCv: "My CV",
    myCvSub: "View and download your professional CV",
    myRecord: "My Record",
    myRecordSub: "Full training and CPD history",
    profileSettings: "Profile Settings",
    profileSettingsSub: "Update your details and preferences",
  },
  zu: {
    greetingMorning: "Sawubona ekuseni",
    greetingAfternoon: "Sawubona emini",
    greetingEvening: "Sawubona kusihlwa",
    loading: "Iyalayisha…",
    modulesOf: (done, total) => `Izifundo ${done} kwezi ${total} ziqediwe`,
    quickActions: "Izenzo ezisheshayo",
    continueTrain: "Qhubeka Ukuqeqesha",
    continueTrainSub: "Qhubeka lapho ushiye khona",
    cpdRefresh: "Ukuqeqesha Okuqhubekayo",
    cpdDue: "Isifundo esisha sitholakala",
    cpdOk: "Kuhleli kahle",
    viewCert: "Buka Isitifiketi",
    certReady: "Ilungele ukulanda",
    certPending: "Qeda ukuqeqesha kuqala",
    getHelp: "Thola Usizo",
    getHelpSub: "Usizo nezimpendulo",
    wifiTitle: "Londoloza idatha —landa nge-WiFi",
    wifiSub: "Landa izinto zakho zokufunda usebenzisa i-WiFi ukuze ufunde noma kuphi ngaphandle kokusebenzisa idatha yeselula.",
    wifiCta: "Landa izinto zokufunda",
    bulletinSingle: (n) => `${n} isaziso esingafundwanga${n > 1 ? "" : ""}`,
    bulletinSub: "Izibuyekezo ezibalulekile evela enkampanini yakho",
    myProfile: "Iphrofayeli yami",
    myCv: "I-CV Yami",
    myCvSub: "Buka futhi ulande i-CV yakho yobuchwepheshe",
    myRecord: "Irekhodi Lami",
    myRecordSub: "Umlando ophelele wokuqeqesha ne-CPD",
    profileSettings: "Izilungiselelo Zephrofayeli",
    profileSettingsSub: "Buyekeza imininingwane yakho nezifiso",
  },
};

export default function PortalHomePage() {
  const [stats, setStats] = useState<DriverStats>(DEMO_STATS);
  const [loading, setLoading] = useState(true);
  const lang = useLanguage();
  const copy = COPY[lang];

  useEffect(() => {
    fetch("/api/portal/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? copy.greetingMorning
      : hour < 17
      ? copy.greetingAfternoon
      : copy.greetingEvening;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Welcome banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1C2333 0%, #243044 100%)",
          border: "1px solid #2d3a4f",
          borderRadius: "1.25rem",
          padding: "1.5rem",
        }}
      >
        <p style={{ color: "#9CA3AF", fontSize: "0.8125rem", margin: "0 0 0.25rem" }}>
          {greeting}
        </p>
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: "1.375rem",
            color: "#F9FAFB",
            margin: "0 0 1rem",
          }}
        >
          {loading ? copy.loading : `${stats.firstName} ${stats.lastName}`}
        </h2>

        {/* Progress bar */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.8125rem", color: "#9CA3AF" }}>
              {stats.programmeTitle}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#14b8a6" }}>
              {stats.progressPercent}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 9999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${stats.progressPercent}%`,
                background: "linear-gradient(90deg, #14b8a6, #34d399)",
                borderRadius: 9999,
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "0.375rem" }}>
            {copy.modulesOf(stats.completedModules, stats.totalModules)}
          </p>
        </div>
      </div>

      {/* Quick action cards */}
      <div>
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.875rem",
          }}
        >
          {copy.quickActions}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.875rem",
          }}
        >
          {/* Continue Training */}
          <Link
            href="/portal/learning"
            style={{
              background: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05))",
              border: "1px solid rgba(20,184,166,0.3)",
              borderRadius: "1rem",
              padding: "1.25rem",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "rgba(20,184,166,0.2)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayCircle size={20} color="#14b8a6" />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "#F9FAFB",
                  margin: "0 0 0.25rem",
                }}
              >
                {copy.continueTrain}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: 0 }}>
                {copy.continueTrainSub}
              </p>
            </div>
          </Link>

          {/* CPD Refresh */}
          <Link
            href="/portal/cpd"
            style={{
              background: stats.cpdDue
                ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))"
                : "#1C2333",
              border: stats.cpdDue
                ? "1px solid rgba(59,130,246,0.3)"
                : "1px solid #2d3a4f",
              borderRadius: "1rem",
              padding: "1.25rem",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              position: "relative",
            }}
          >
            {stats.cpdDue && (
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  width: 8,
                  height: 8,
                  background: "#F59E0B",
                  borderRadius: "9999px",
                }}
              />
            )}
            <div
              style={{
                width: 40,
                height: 40,
                background: stats.cpdDue
                  ? "rgba(59,130,246,0.2)"
                  : "rgba(255,255,255,0.05)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RefreshCw size={20} color={stats.cpdDue ? "#3B82F6" : "#6B7280"} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "#F9FAFB",
                  margin: "0 0 0.25rem",
                }}
              >
                {copy.cpdRefresh}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: stats.cpdDue ? "#3B82F6" : "#9CA3AF",
                  margin: 0,
                }}
              >
                {stats.cpdDue ? copy.cpdDue : copy.cpdOk}
              </p>
            </div>
          </Link>

          {/* View Certificate */}
          <Link
            href="/portal/certificate"
            style={{
              background: stats.certificateReady
                ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))"
                : "#1C2333",
              border: stats.certificateReady
                ? "1px solid rgba(16,185,129,0.3)"
                : "1px solid #2d3a4f",
              borderRadius: "1rem",
              padding: "1.25rem",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: stats.certificateReady
                  ? "rgba(16,185,129,0.2)"
                  : "rgba(255,255,255,0.05)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={20} color={stats.certificateReady ? "#10B981" : "#6B7280"} />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "#F9FAFB",
                  margin: "0 0 0.25rem",
                }}
              >
                {copy.viewCert}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: stats.certificateReady ? "#10B981" : "#9CA3AF",
                  margin: 0,
                }}
              >
                {stats.certificateReady ? copy.certReady : copy.certPending}
              </p>
            </div>
          </Link>

          {/* Get Help */}
          <Link
            href="/portal/support"
            style={{
              background: "#1C2333",
              border: "1px solid #2d3a4f",
              borderRadius: "1rem",
              padding: "1.25rem",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.05)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HelpCircle size={20} color="#9CA3AF" />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "#F9FAFB",
                  margin: "0 0 0.25rem",
                }}
              >
                {copy.getHelp}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9CA3AF", margin: 0 }}>
                {copy.getHelpSub}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Offline download tip */}
      <div
        style={{
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.18)",
          borderRadius: "1rem",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.875rem",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "rgba(59,130,246,0.15)",
            borderRadius: "0.625rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Wifi size={16} color="#3B82F6" />
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "#F9FAFB",
              margin: "0 0 0.25rem",
            }}
          >
            {copy.wifiTitle}
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#9CA3AF",
              margin: "0 0 0.625rem",
              lineHeight: 1.5,
            }}
          >
            {copy.wifiSub}
          </p>
          <Link
            href="/portal/learning"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "#3B82F6",
              textDecoration: "none",
            }}
          >
            <Download size={13} /> {copy.wifiCta}
          </Link>
        </div>
      </div>

      {/* Bulletins alert */}
      {stats.unreadBulletins > 0 && (
        <Link
          href="/portal/bulletins"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "1rem",
            padding: "1rem 1.25rem",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "rgba(245,158,11,0.15)",
              borderRadius: "0.625rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <Bell size={16} color="#F59E0B" />
            <div
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                width: 16,
                height: 16,
                background: "#EF4444",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.625rem",
                fontWeight: 700,
                color: "white",
              }}
            >
              {stats.unreadBulletins}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#F9FAFB",
                margin: "0 0 0.125rem",
              }}
            >
              {copy.bulletinSingle(stats.unreadBulletins)}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>
              {copy.bulletinSub}
            </p>
          </div>
          <ChevronRight size={16} color="#6B7280" />
        </Link>
      )}

      {/* Quick links */}
      <div>
        <h3
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "0.875rem",
          }}
        >
          {copy.myProfile}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            {
              href: "/portal/cv",
              icon: TrendingUp,
              label: copy.myCv,
              desc: copy.myCvSub,
            },
            {
              href: "/portal/progress",
              icon: CheckCircle2,
              label: copy.myRecord,
              desc: copy.myRecordSub,
            },
            {
              href: "/portal/profile",
              icon: Clock,
              label: copy.profileSettings,
              desc: copy.profileSettingsSub,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.875rem 1rem",
                background: "#1C2333",
                border: "1px solid #2d3a4f",
                borderRadius: "0.875rem",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "0.625rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <item.icon size={16} color="#9CA3AF" />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "#F9FAFB",
                    margin: "0 0 0.125rem",
                  }}
                >
                  {item.label}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", margin: 0 }}>
                  {item.desc}
                </p>
              </div>
              <ChevronRight size={14} color="#4B5563" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
