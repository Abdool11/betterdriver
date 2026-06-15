"use client";

import { useEffect, useState } from "react";


import {
  User,
  CreditCard,
  Truck,
  Award,
  Download,
  RefreshCw,
  Shield,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Briefcase,
} from "lucide-react";

interface DriverProfile {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  id_number: string;
  date_of_birth: string;
  licence_number: string;
  licence_class: string;
  licence_expiry: string;
  prpd_number: string;
  years_experience: string;
  vehicle_types: string[];
  work_history?: WorkEntry[];
  profile_complete: boolean;
}

interface WorkEntry {
  employer: string;
  job_title: string;
  from_year: string;
  to_year: string;
  current: boolean;
}

interface Certification {
  id: string;
  programme_title: string;
  issued_at: string;
  certificate_number: string;
  status: "certified" | "in_progress";
}

interface CpdRecord {
  id: string;
  module_title: string;
  completed_at: string;
  year: number;
}

const certs: Certification[] = [];
const cpdRecords: CpdRecord[] = [];

export default function CVPage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/portal/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.driver) setProfile(d.driver);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function downloadCV() {
    setDownloading(true);
    try {
      const res = await fetch("/api/portal/cv", { method: "POST" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BetterDriver_CV_${profile?.first_name}_${profile?.last_name}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Fallback: open print dialog for the CV section
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", gap: "0.75rem" }}>
        <Loader2 size={20} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "var(--text-muted)" }}>Loading your CV…</span>
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "0.875rem",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem",
    fontSize: "0.9rem",
  };

  const labelCol: React.CSSProperties = {
    color: "var(--text-muted)",
    fontSize: "0.8125rem",
    minWidth: "9rem",
    flexShrink: 0,
  };

  const valueCol: React.CSSProperties = {
    color: "var(--text-primary)",
    fontWeight: 500,
    textAlign: "right",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} id="cv-printable">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>
            Driver CV
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
            Your verified professional driver profile
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={downloadCV}
          disabled={downloading}
          style={{ flexShrink: 0, fontSize: "0.875rem" }}
        >
          {downloading ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Download size={14} />
          )}
          Download PDF
        </button>
      </div>

      {/* Profile completeness banner */}
      {profile && !profile.profile_complete && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.875rem 1rem",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            color: "var(--amber)",
          }}
        >
          <Clock size={15} style={{ flexShrink: 0 }} />
          <span>
            Your profile is incomplete. <a href="/portal/setup" style={{ color: "var(--amber)", fontWeight: 600 }}>Complete your profile</a> to unlock your full CV and download.
          </span>
        </div>
      )}

      {/* ── Personal info ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <User size={15} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Personal
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={rowStyle}>
            <span style={labelCol}>Full name</span>
            <span style={valueCol}>{profile?.first_name} {profile?.last_name}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>ID number</span>
            <span style={valueCol}>{profile?.id_number || <Placeholder />}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>Mobile</span>
            <span style={valueCol}>{profile?.mobile || <Placeholder />}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>Email</span>
            <span style={valueCol}>{profile?.email || <Placeholder />}</span>
          </div>
        </div>
      </div>

      {/* ── Licence ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <CreditCard size={15} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Driving Licence
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={rowStyle}>
            <span style={labelCol}>Licence number</span>
            <span style={valueCol}>{profile?.licence_number || <Placeholder />}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>Licence class</span>
            <span style={valueCol}>{profile?.licence_class || <Placeholder />}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>Expiry date</span>
            <span style={valueCol}>
              {profile?.licence_expiry
                ? new Date(profile.licence_expiry).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
                : <Placeholder />}
            </span>
          </div>
          {profile?.prpd_number && (
            <div style={rowStyle}>
              <span style={labelCol}>PrDP number</span>
              <span style={valueCol}>{profile.prpd_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Experience ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <Truck size={15} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Experience
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={rowStyle}>
            <span style={labelCol}>Years driving</span>
            <span style={valueCol}>{profile?.years_experience || <Placeholder />}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelCol}>Vehicle types</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", justifyContent: "flex-end", maxWidth: "60%" }}>
              {profile?.vehicle_types?.length ? (
                profile.vehicle_types.map((v) => (
                  <span
                    key={v}
                    style={{
                      padding: "0.2rem 0.5rem",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      color: "var(--amber)",
                      fontWeight: 500,
                    }}
                  >
                    {v}
                  </span>
                ))
              ) : (
                <Placeholder />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Career History ── */}
      {profile?.work_history && profile.work_history.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Briefcase size={15} style={{ color: "var(--amber)" }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Career History
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {profile.work_history.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  paddingBottom: i < (profile.work_history?.length ?? 0) - 1 ? "0.75rem" : 0,
                  borderBottom: i < (profile.work_history?.length ?? 0) - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                  {entry.job_title || "Driver"}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {entry.employer}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {entry.from_year}{entry.from_year ? " – " : ""}{entry.current ? "Present" : entry.to_year}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <Award size={15} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Certifications
          </span>
        </div>
        {certs.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>No certifications yet. Complete your programme to earn your certificate.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {certs.map((cert) => (
              <div
                key={cert.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.875rem",
                  background: "rgba(46,204,113,0.06)",
                  border: "1px solid rgba(46,204,113,0.2)",
                  borderRadius: "0.625rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                  <CheckCircle2 size={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: "0.125rem" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "0.2rem" }}>
                      {cert.programme_title}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      Issued {new Date(cert.issued_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                      {cert.certificate_number}
                    </div>
                  </div>
                </div>
                <a
                  href={`/portal/certificate`}
                  style={{ color: "var(--amber)", flexShrink: 0 }}
                  title="View certificate"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CPD Record ── */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <RefreshCw size={15} style={{ color: "var(--amber)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            CPD Record
          </span>
        </div>
        {cpdRecords.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>No CPD modules completed yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {cpdRecords.map((cpd) => (
              <div key={cpd.id} style={rowStyle}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{cpd.module_title}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem", flexShrink: 0 }}>
                  {new Date(cpd.completed_at).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registry note */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.625rem",
          padding: "0.875rem 1rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        <Shield size={13} style={{ flexShrink: 0, marginTop: "0.125rem", color: "var(--text-muted)" }} />
        <span>
          Your certifications are publicly verifiable on the <a href="/registry" style={{ color: "var(--amber)" }}>BetterDriver Registry</a>. Employers can verify your certificate number at any time.
        </span>
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontWeight: 400, fontSize: "0.8125rem" }}>
      Not provided
    </span>
  );
}
