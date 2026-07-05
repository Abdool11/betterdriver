"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


import {
  User, CreditCard, Truck, Briefcase, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, AlertTriangle,
  Plus, Trash2, Wifi, Download,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

interface ProfileData {
  id_number: string; date_of_birth: string; mobile: string;
  licence_number: string; licence_class: string; licence_expiry: string; prpd_number: string;
  years_experience: string; vehicle_types: string[]; work_history: WorkEntry[];
}
interface WorkEntry { employer: string; job_title: string; from_year: string; to_year: string; current: boolean; }

const VEHICLE_TYPES = ["Rigid truck (Code 10)","Articulated truck (Code 14)","Tanker","Flatbed / lowbed","Refrigerated truck","Tipper","Crane truck","Bus / coach","LDV / panel van"];
const LICENCE_CLASSES = ["Code 8","Code 10","Code 14","Code EC","Code EB"];
const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i));
const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Licence", icon: CreditCard },
  { id: 3, label: "Experience", icon: Truck },
  { id: 4, label: "Career", icon: Briefcase },
  { id: 5, label: "Done", icon: CheckCircle2 },
];
const EMPTY_ENTRY: WorkEntry = { employer: "", job_title: "", from_year: "", to_year: "", current: false };

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ProfileData>({
    id_number: "", date_of_birth: "", mobile: "",
    licence_number: "", licence_class: "", licence_expiry: "", prpd_number: "",
    years_experience: "", vehicle_types: [], work_history: [],
  });

  function update(field: keyof ProfileData, value: string | string[] | WorkEntry[]) {
    setData((prev) => ({ ...prev, [field]: value })); setError("");
  }
  function toggleVehicle(v: string) {
    setData((prev) => ({ ...prev, vehicle_types: prev.vehicle_types.includes(v) ? prev.vehicle_types.filter((x) => x !== v) : [...prev.vehicle_types, v] }));
  }
  function addWorkEntry() { setData((prev) => ({ ...prev, work_history: [...prev.work_history, { ...EMPTY_ENTRY }] })); }
  function updateWorkEntry(index: number, field: keyof WorkEntry, value: string | boolean) {
    setData((prev) => {
      const updated = [...prev.work_history];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "current" && value === true) updated[index].to_year = "";
      return { ...prev, work_history: updated };
    });
  }
  function removeWorkEntry(index: number) { setData((prev) => ({ ...prev, work_history: prev.work_history.filter((_, i) => i !== index) })); }

  async function saveStep(nextStep: Step | "done") {
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/portal/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Save failed. Please try again."); setSaving(false); return; }
      if (nextStep === "done") { setStep(5); } else { setStep(nextStep as Step); }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.75rem 0.875rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "0.9375rem", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem" };
  const cardStyle: React.CSSProperties = { width: "100%", maxWidth: "28rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 1rem 3rem" }}>
      {/* Progress steps */}
      <div style={{ width: "100%", maxWidth: "28rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon; const done = step > s.id; const active = step === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "var(--success)" : active ? "var(--amber)" : "var(--bg-elevated)", border: `2px solid ${done ? "var(--success)" : active ? "var(--amber)" : "var(--border)"}`, color: done || active ? "#0d1526" : "var(--text-muted)", transition: "all 0.2s" }}>
                    {done ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                  </div>
                  <span style={{ fontSize: "0.625rem", color: active ? "var(--text-primary)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: "2px", background: step > s.id ? "var(--success)" : "var(--border)", margin: "0 0.2rem", marginBottom: "1.25rem", transition: "background 0.2s" }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        {/* STEP 1 */}
        {step === 1 && (<>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>Personal details</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>This information is used to verify your identity and appears on your certificate.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div><label style={labelStyle}>SA ID number</label><input style={inputStyle} type="text" placeholder="13-digit ID number" value={data.id_number} onChange={(e) => update("id_number", e.target.value)} maxLength={13} /></div>
            <div><label style={labelStyle}>Date of birth</label><input style={inputStyle} type="date" value={data.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} /></div>
            <div><label style={labelStyle}>Mobile number</label><input style={inputStyle} type="tel" placeholder="e.g. 082 123 4567" value={data.mobile} onChange={(e) => update("mobile", e.target.value)} /></div>
          </div>
          {error && <ErrorBanner message={error} />}
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button className="btn" style={{ flex: 1, justifyContent: "center", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.875rem" }} onClick={() => router.push("/portal")}>Skip for now</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => saveStep(2)} disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null} Next <ChevronRight size={15} /></button>
          </div>
        </>)}

        {/* STEP 2 */}
        {step === 2 && (<>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>Driving licence</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Your licence details appear on your BetterDriver CV and certificate.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div><label style={labelStyle}>Licence number</label><input style={inputStyle} type="text" placeholder="e.g. 73456789" value={data.licence_number} onChange={(e) => update("licence_number", e.target.value)} /></div>
            <div><label style={labelStyle}>Licence class</label><select style={{ ...inputStyle }} value={data.licence_class} onChange={(e) => update("licence_class", e.target.value)}><option value="">Select licence class</option>{LICENCE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label style={labelStyle}>Licence expiry date</label><input style={inputStyle} type="date" value={data.licence_expiry} onChange={(e) => update("licence_expiry", e.target.value)} /></div>
            <div><label style={labelStyle}>PrDP number <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label><input style={inputStyle} type="text" placeholder="Professional Driving Permit number" value={data.prpd_number} onChange={(e) => update("prpd_number", e.target.value)} /></div>
          </div>
          {error && <ErrorBanner message={error} />}
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button className="btn" style={{ flex: 1, justifyContent: "center", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={() => setStep(1)}><ChevronLeft size={15} /> Back</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => saveStep(3)} disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null} Next <ChevronRight size={15} /></button>
          </div>
        </>)}

        {/* STEP 3 */}
        {step === 3 && (<>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>Driving experience</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>Select all vehicle types you have experience driving.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <div><label style={labelStyle}>Years of professional driving experience</label><select style={{ ...inputStyle }} value={data.years_experience} onChange={(e) => update("years_experience", e.target.value)}><option value="">Select years</option>{["Less than 1 year","1–2 years","3–5 years","6–10 years","11–15 years","16–20 years","20+ years"].map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
            <div>
              <label style={labelStyle}>Vehicle types driven</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                {VEHICLE_TYPES.map((v) => { const selected = data.vehicle_types.includes(v); return (<button key={v} type="button" onClick={() => toggleVehicle(v)} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", fontSize: "0.8125rem", fontWeight: 500, border: `1px solid ${selected ? "var(--amber)" : "var(--border)"}`, background: selected ? "rgba(245,158,11,0.15)" : "transparent", color: selected ? "var(--amber)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s" }}>{v}</button>); })}
              </div>
            </div>
          </div>
          {error && <ErrorBanner message={error} />}
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button className="btn" style={{ flex: 1, justifyContent: "center", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={() => setStep(2)}><ChevronLeft size={15} /> Back</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => saveStep(4)} disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null} Next <ChevronRight size={15} /></button>
          </div>
        </>)}

        {/* STEP 4: Career History (optional) */}
        {step === 4 && (<>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--text-primary)" }}>Career history</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>Add your previous employers to strengthen your CV. You can skip this and come back later from your profile.</p>
          </div>
          {data.work_history.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.work_history.map((entry, i) => (
                <div key={i} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>Employer {i + 1}</span>
                    <button type="button" onClick={() => removeWorkEntry(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}><Trash2 size={14} /></button>
                  </div>
                  <div><label style={labelStyle}>Company / employer name</label><input style={inputStyle} type="text" placeholder="e.g. ABC Logistics" value={entry.employer} onChange={(e) => updateWorkEntry(i, "employer", e.target.value)} /></div>
                  <div><label style={labelStyle}>Job title / role</label><input style={inputStyle} type="text" placeholder="e.g. Long-haul truck driver" value={entry.job_title} onChange={(e) => updateWorkEntry(i, "job_title", e.target.value)} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                    <div><label style={labelStyle}>From year</label><select style={{ ...inputStyle }} value={entry.from_year} onChange={(e) => updateWorkEntry(i, "from_year", e.target.value)}><option value="">Year</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
                    <div><label style={labelStyle}>To year</label><select style={{ ...inputStyle, opacity: entry.current ? 0.4 : 1 }} value={entry.to_year} onChange={(e) => updateWorkEntry(i, "to_year", e.target.value)} disabled={entry.current}><option value="">Year</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={entry.current} onChange={(e) => updateWorkEntry(i, "current", e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--amber)" }} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>I currently work here</span>
                  </label>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={addWorkEntry} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", background: "transparent", border: "1px dashed var(--border)", borderRadius: "0.75rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", width: "100%" }}><Plus size={15} /> Add employer</button>
          {error && <ErrorBanner message={error} />}
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button className="btn" style={{ flex: 1, justifyContent: "center", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={() => setStep(3)}><ChevronLeft size={15} /> Back</button>
            <button className="btn" style={{ flex: 1, justifyContent: "center", background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }} onClick={() => saveStep("done")} disabled={saving}>Skip</button>
            <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={() => saveStep("done")} disabled={saving}>{saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null} Finish <CheckCircle2 size={15} /></button>
          </div>
        </>)}

        {/* STEP 5: Done */}
        {step === 5 && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center" }}>
            <div style={{ width: "4.5rem", height: "4.5rem", borderRadius: "50%", background: "rgba(46,204,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>Profile complete!</h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "22rem" }}>Your BetterDriver profile is set up. You can now access your training, track your progress, and build your driver CV.</p>
            </div>
            <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.875rem", padding: "1rem", textAlign: "left", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: 32, height: 32, background: "rgba(59,130,246,0.15)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Wifi size={15} color="#3B82F6" /></div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", margin: "0 0 0.25rem" }}>Save data — download on WiFi</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 0.625rem", lineHeight: 1.5 }}>If you are on WiFi now, download your course material so you can study anywhere without using mobile data.</p>
                  <button type="button" onClick={() => router.push("/portal/learning?download=1")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "0.5rem", color: "#3B82F6", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}><Download size={13} /> Download course material</button>
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-full" style={{ justifyContent: "center", width: "100%" }} onClick={() => router.push("/portal")}>Go to my dashboard <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", color: "#f87171", fontSize: "0.875rem" }}>
      <AlertTriangle size={14} style={{ flexShrink: 0 }} />{message}
    </div>
  );
}
