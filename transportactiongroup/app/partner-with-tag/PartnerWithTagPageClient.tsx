"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { ENQUIRY_TYPES } from "@/lib/constants";

const PARTNERSHIP_TYPES = [
  {
    title: "DFI and Donor Partnership",
    description:
      "Identify credible, implementation-ready platforms for green freight investment. TAG provides the structure, stakeholder alignment, and practical pathways that make funding viable and impactful.",
    outcomes: [
      "Access to structured action plan frameworks",
      "Stakeholder alignment support",
      "Implementation monitoring and reporting",
      "Ecosystem visibility and credibility",
    ],
  },
  {
    title: "Industry Body Collaboration",
    description:
      "Develop coordinated transformation pathways for your sector. TAG facilitates the workshops, action plans, and implementation support that help industry associations move from aspiration to structured action.",
    outcomes: [
      "Sector-specific action plan development",
      "Targeted workshop facilitation",
      "Member engagement and alignment",
      "Implementation guidance and support",
    ],
  },
  {
    title: "Ecosystem Collaboration",
    description:
      "Align your organisation's work with the broader green freight transformation ecosystem. TAG is the convening platform that brings together the stakeholders, frameworks, and momentum needed for systemic change.",
    outcomes: [
      "Ecosystem alignment and visibility",
      "Collaborative programme development",
      "Joint intervention design",
      "Shared implementation platforms",
    ],
  },
];

export default function PartnerWithTagPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/submit-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("contact_name"),
          organisation: data.get("organisation_name"),
          email: data.get("email"),
          phone: data.get("mobile"),
          role: data.get("enquiry_type"),
          subject: `Partnership enquiry — ${data.get("organisation_name")}`,
          message: `Fleet size: ${data.get("fleet_size") || "Not provided"}\n\n${data.get("nature_of_enquiry")}`,
          source: "tag_partnership",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      form.reset();
    } catch {
      setError("Something went wrong. Please try again or email us directly at durbanroadtransport@gmail.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="badge mb-4">Partner with TAG</span>
          <h1 className="mb-6">
            Help shape the future of{" "}
            <span className="gradient-text">green freight transformation</span>
          </h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            TAG is the enabling environment platform. We work with DFIs, donors, industry bodies,
            public-sector actors, and ecosystem collaborators to create the conditions for
            practical, scalable green freight transformation.
          </p>
        </div>

        {/* Partnership types */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PARTNERSHIP_TYPES.map((type) => (
            <div key={type.title} className="card flex flex-col">
              <h3 className="text-base font-semibold mb-3">{type.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                {type.description}
              </p>
              <ul className="space-y-2">
                {type.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enquiry form */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <h2 className="mb-3">Start a conversation</h2>
            <p className="text-muted-foreground">
              Tell us about your organisation and what you are looking to explore. We will respond
              within 2 business days.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-400" size={40} />
              <h2 className="text-xl font-bold mb-2">Enquiry received</h2>
              <p className="text-muted-foreground">
                Thank you for reaching out. A member of the TAG team will respond within 2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Organisation name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="organisation_name"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Organisation type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="enquiry_type"
                    required
                    defaultValue="partnership"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  >
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="contact_name"
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mobile <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    name="mobile"
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fleet size <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    name="fleet_size"
                    type="text"
                    placeholder="e.g. 50 trucks"
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nature of enquiry <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="nature_of_enquiry"
                  required
                  rows={4}
                  placeholder="Describe what you are looking to explore or discuss..."
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 text-sm resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full justify-center py-4 disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin mr-2 inline" /> Sending...</>
                ) : (
                  <>Submit enquiry <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
