"use client";

import { useState } from "react";
import { ENQUIRY_TYPES, SITE_NAME } from "@/lib/constants";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
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
          subject: `Contact enquiry — ${data.get("organisation_name")}`,
          message: `Fleet size: ${data.get("fleet_size") || "Not provided"}\n\n${data.get("nature_of_enquiry")}`,
          source: "tag_contact",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
      form.reset();
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="mb-12">
          <span className="badge mb-4">Contact TAG</span>
          <h1 className="mb-4">Start a conversation</h1>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Whether you are a DFI, industry body, public-sector actor, or ecosystem collaborator —
            we would like to hear from you. Tell us briefly about your organisation and the nature
            of your enquiry and we will be in touch.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-10 text-center">
            <CheckCircle className="mx-auto mb-4 text-green-400" size={40} />
            <h2 className="text-xl font-bold mb-2">Enquiry received</h2>
            <p className="text-muted-foreground">Thank you for reaching out. A member of the TAG team will respond within 2 business days.</p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organisation name */}
          <div>
            <label htmlFor="organisation_name" className="block text-sm font-medium mb-2">
              Organisation name <span className="text-red-400">*</span>
            </label>
            <input
              id="organisation_name"
              name="organisation_name"
              type="text"
              required
              placeholder="Your organisation"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            />
          </div>

          {/* Role of organisation */}
          <div>
            <label htmlFor="organisation_role" className="block text-sm font-medium mb-2">
              Role of your organisation <span className="text-red-400">*</span>
            </label>
            <select
              id="organisation_role"
              name="enquiry_type"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            >
              <option value="">Select organisation type</option>
              {ENQUIRY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contact name */}
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium mb-2">
              Your name <span className="text-red-400">*</span>
            </label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              required
              placeholder="Full name"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@organisation.com"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            />
          </div>

          {/* Mobile — optional */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium mb-2">
              Mobile <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="+27 ..."
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            />
          </div>

          {/* Fleet size — optional */}
          <div>
            <label htmlFor="fleet_size" className="block text-sm font-medium mb-2">
              Fleet size <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </label>
            <input
              id="fleet_size"
              name="fleet_size"
              type="text"
              placeholder="e.g. 50 trucks"
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm"
            />
          </div>

          {/* Nature of enquiry */}
          <div>
            <label htmlFor="nature_of_enquiry" className="block text-sm font-medium mb-2">
              Nature of enquiry <span className="text-red-400">*</span>
            </label>
            <textarea
              id="nature_of_enquiry"
              name="nature_of_enquiry"
              required
              rows={4}
              placeholder="Briefly describe what you are looking to explore or discuss..."
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/60 transition-colors text-sm resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-4 disabled:opacity-60">
            {submitting ? <><Loader2 size={16} className="animate-spin mr-2 inline" /> Sending...</> : "Send enquiry"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            We will respond within 2 business days.
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
