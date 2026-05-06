"use client";

import { Metadata } from "next";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { MOCK_DRIVER } from "@/lib/constants";
import { User, Truck, Briefcase, ChevronDown } from "lucide-react";
import TranslatedPageHeader from "@/components/portal/TranslatedPageHeader";
import { useState } from "react";



// DATA REQUIREMENTS:
// - driver: Driver — Supabase: SELECT * FROM drivers WHERE id = auth.uid()
// - UPDATE via Server Action: /api/profile/update
// TODO: Asif — replace mock data with live Supabase query and implement form submission

export default function ProfilePage() {
  const driver = MOCK_DRIVER;
  const [openSection, setOpenSection] = useState<string | null>("personal");

  const sections = [
    {
      id: "personal",
      icon: <User size={18} />,
      title: "Personal details",
      completion: 80,
      fields: [
        { label: "Full name", value: driver.name, type: "text" },
        { label: "ID number", value: driver.idNumber, type: "text" },
        { label: "Mobile", value: driver.mobile, type: "tel" },
        { label: "Email", value: driver.email, type: "email" },
      ],
    },
    {
      id: "licence",
      icon: <Truck size={18} />,
      title: "Licence & PDP",
      completion: 60,
      fields: [
        { label: "Licence number", value: driver.licenceNumber, type: "text" },
        { label: "Licence code", value: driver.licenceCode, type: "text" },
        { label: "PDP number", value: driver.pdpNumber || "", type: "text" },
        { label: "PDP expiry", value: driver.pdpExpiry || "", type: "date" },
      ],
    },
    {
      id: "work",
      icon: <Briefcase size={18} />,
      title: "Work history",
      completion: 40,
      fields: [
        { label: "Current employer", value: driver.currentEmployer || "", type: "text" },
        { label: "Years driving", value: driver.yearsExperience?.toString() || "", type: "number" },
        { label: "Vehicle types driven", value: driver.vehicleTypes?.join(", ") || "", type: "text" },
      ],
    },
  ];

  const overallCompletion = Math.round(
    sections.reduce((sum, s) => sum + s.completion, 0) / sections.length
  );

  return (
    <PortalLayout>
      <div className="mock-banner" style={{ marginBottom: "1.5rem" }}>
        MOCK DATA — Asif to connect live Supabase driver profile query and Server Action for updates
      </div>
      <TranslatedPageHeader pageKey="profile" />

      {/* Completion meter */}
      <div
        style={{
          background: "#1C2333",
          border: "1px solid #2d3a4f",
          borderRadius: "1.25rem",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", margin: "0 0 0.375rem" }}>Profile completion</p>
          <div className="progress-bar" style={{ width: "100%", maxWidth: 300 }}>
            <div className="progress-fill" style={{ width: `${overallCompletion}%` }} />
          </div>
        </div>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#F59E0B", margin: 0 }}>
          {overallCompletion}%
        </p>
      </div>

      {/* Accordion sections */}
      {sections.map((section) => (
        <div
          key={section.id}
          style={{
            background: "#1C2333",
            border: "1px solid #2d3a4f",
            borderRadius: "1rem",
            marginBottom: "0.75rem",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              padding: "1rem 1.25rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ color: "#F59E0B" }}>{section.icon}</span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F9FAFB", flex: 1 }}>
              {section.title}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#6B7280", marginRight: "0.5rem" }}>{section.completion}%</span>
            <ChevronDown
              size={16}
              style={{
                color: "#6B7280",
                transform: openSection === section.id ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>
          {openSection === section.id && (
            <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid #2d3a4f" }}>
              {/* TODO: Asif — wire each field to a Server Action for profile update */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", marginBottom: "0.375rem" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      style={{
                        width: "100%",
                        background: "#243044",
                        border: "1px solid #2d3a4f",
                        borderRadius: "0.625rem",
                        padding: "0.625rem 0.875rem",
                        color: "#F9FAFB",
                        fontSize: "0.875rem",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: "1.25rem", fontSize: "0.875rem", padding: "0.625rem 1.25rem" }}>
                Save changes
              </button>
            </div>
          )}
        </div>
      ))}

      {/* CV builder placeholder */}
      <div
        style={{
          background: "rgba(245,158,11,0.06)",
          border: "1px dashed rgba(245,158,11,0.25)",
          borderRadius: "1rem",
          padding: "1.5rem",
          marginTop: "1rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#F59E0B", margin: "0 0 0.375rem" }}>
          CV Builder
        </p>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0 0 1rem" }}>
          Generate a professional driver CV from your profile, certifications, and CPD record.
        </p>
        {/* TODO: Asif — implement CV generation via /api/cv/generate */}
        <button className="btn-secondary" style={{ fontSize: "0.875rem" }}>
          Generate my CV (coming soon)
        </button>
      </div>
    </PortalLayout>
  );
}
