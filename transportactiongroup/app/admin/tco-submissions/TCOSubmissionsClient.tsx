"use client";
import { useState } from "react";
import { Download, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Submission {
  id: string;
  user_name: string;
  user_email: string;
  company: string;
  country: string | null;
  currency_code: string;
  truck_type: string | null;
  use_case: string | null;
  notes: string | null;
  diesel_tco: number | null;
  electric_tco: number | null;
  total_saving: number | null;
  break_even_year: number | null;
  export_type: string | null;
  submitted_at: string;
}

export default function TCOSubmissionsClient({
  initialSubmissions,
}: {
  initialSubmissions: Submission[];
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fmt = (n: number | null, symbol = "R") =>
    n != null
      ? `${symbol} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`
      : "—";

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/tco-submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      } else {
        alert("Failed to delete. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    const headers = [
      "ID", "Name", "Email", "Company", "Country", "Currency",
      "Truck Type", "Use Case", "Diesel TCO", "Electric TCO",
      "Total Saving", "Break-Even Year", "Export Type", "Submitted At",
    ];
    const rows = submissions.map(s => [
      s.id, s.user_name, s.user_email, s.company, s.country ?? "",
      s.currency_code, s.truck_type ?? "", s.use_case ?? "",
      s.diesel_tco ?? "", s.electric_tco ?? "", s.total_saving ?? "",
      s.break_even_year ?? "", s.export_type ?? "",
      new Date(s.submitted_at).toLocaleString("en-ZA"),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tco-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">TCO Calculator Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 text-sm hover:bg-muted/40 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted-foreground text-sm">No submissions yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Submissions are recorded when a user fills in their details before downloading a TCO export.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(s => (
            <div key={s.id} className="card overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-medium text-sm">{s.user_name}</span>
                    <span className="text-xs text-muted-foreground">{s.user_email}</span>
                    <span className="text-xs bg-muted/40 px-2 py-0.5 rounded-full">{s.company}</span>
                    {s.country && (
                      <span className="text-xs text-muted-foreground">{s.country}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.submitted_at).toLocaleDateString("en-ZA", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.currency_code}</span>
                    {s.truck_type && <span className="text-xs text-muted-foreground">{s.truck_type}</span>}
                    {s.export_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.export_type === "pdf" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
                        {s.export_type.toUpperCase()}
                      </span>
                    )}
                    {s.total_saving != null && (
                      <span className={`text-xs font-medium ${s.total_saving >= 0 ? "text-green-400" : "text-amber-400"}`}>
                        {s.total_saving >= 0 ? "Saving: " : "Diesel cheaper: "}
                        {fmt(Math.abs(s.total_saving), s.currency_code === "ZAR" ? "R" : s.currency_code)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    className="p-2 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground"
                    title="View details"
                  >
                    {expanded === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === s.id && (
                <div className="border-t border-border/30 p-4 bg-muted/10">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Diesel TCO</p>
                      <p className="font-medium">{fmt(s.diesel_tco, s.currency_code === "ZAR" ? "R" : s.currency_code)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Electric TCO</p>
                      <p className="font-medium">{fmt(s.electric_tco, s.currency_code === "ZAR" ? "R" : s.currency_code)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Break-even year</p>
                      <p className="font-medium">{s.break_even_year ?? "Not reached"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Use case</p>
                      <p className="font-medium">{s.use_case ?? "—"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground mb-0.5">Notes</p>
                      <p className="font-medium">{s.notes ?? "—"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
