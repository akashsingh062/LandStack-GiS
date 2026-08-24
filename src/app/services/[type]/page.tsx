"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as Lucide from "lucide-react";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/security/auth-context";

const SERVICE_INFO: Record<string, { name: string; icon: React.ReactNode; department: string; fields: string[] }> = {
  "ownership-verification": { name: "Ownership Verification", icon: <Lucide.CheckCircle2 size={24} />, department: "Revenue Department", fields: ["parcel", "purpose"] },
  "ror-extract": { name: "RoR Extract Request", icon: <Lucide.FileText size={24} />, department: "Revenue Department", fields: ["parcel", "purpose"] },
  "encumbrance-certificate": { name: "Encumbrance Certificate", icon: <Lucide.Lock size={24} />, department: "Registration Department", fields: ["parcel", "period"] },
  "building-permission": { name: "Building Permission", icon: <Lucide.Hammer size={24} />, department: "Planning Department", fields: ["parcel", "building_type", "area", "floors"] },
  "land-use-certificate": { name: "Land Use Certificate", icon: <Lucide.Trees size={24} />, department: "Planning Department", fields: ["parcel", "purpose"] },
  "property-tax": { name: "Property Tax Query", icon: <Lucide.Wallet size={24} />, department: "Municipality Department", fields: ["parcel"] },
  "mutation": { name: "Property Mutation", icon: <Lucide.FileSignature size={24} />, department: "Revenue Department", fields: ["parcel", "mutation_reason", "new_owner"] },
  "restriction-check": { name: "Restriction Check", icon: <Lucide.AlertTriangle size={24} />, department: "Revenue Department", fields: ["parcel"] },
};

function ServiceFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const type = params.type as string;
  const info = SERVICE_INFO[type] || { name: type, icon: <Lucide.FileText size={24} />, department: "Revenue Department", fields: ["parcel"] };

  const [form, setForm] = useState({
    parcel_ulpin: searchParams.get("parcel") || "IN-BR-PTN-0001051",
    purpose: "purchase",
    building_type: "residential",
    area: "120",
    floors: "2",
    period: "5",
    mutation_reason: "sale",
    new_owner: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [appId, setAppId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If user is not logged in, prompt to login with return redirect
  if (!currentUser) {
    return (
      <div className="app-content animate-in" style={{ maxWidth: 600, margin: "24px auto" }}>
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)", color: "var(--brand-primary)" }}>
            <Lucide.Lock size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Citizen Login Required
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>
            You must be logged in as a verified citizen to submit statutory applications for <strong>{info.name}</strong> to the <strong>{info.department}</strong>.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/login?redirect=/services/${type}`}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: "10px 20px" }}
            >
              <span>🔑 Login / Sign Up to Continue</span>
            </Link>
            <Link href="/services" className="btn btn-secondary">
              ← Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post("/api/v1/services", {
        service_type: type,
        parcel_ulpin: form.parcel_ulpin,
        applicant_name: currentUser.name || "Citizen Applicant",
        applicant_email: currentUser.email || "citizen@biharbhumi.bihar.gov.in",
        applicant_phone: currentUser.phone || "+91-9876543210",
        purpose: form.purpose || form.mutation_reason || "Citizen service request",
        details: form,
        priority: "NORMAL",
      });

      const data = res.data;
      setAppId(data.application?.application_no || `LS-2026-${Math.floor(10000 + Math.random() * 90000)}`);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="app-content animate-in">
        <div className="card" style={{ maxWidth: 580, margin: "0 auto", textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ color: "var(--status-success)", marginBottom: "var(--space-md)" }}>
            <Lucide.CheckCircle size={52} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: "var(--space-xs)" }}>
            Application Submitted Successfully
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: "var(--space-lg)" }}>
            Your statutory <strong>{info.name}</strong> request has been dispatched to <strong>{info.department}</strong>.
          </p>

          <div className="card" style={{ background: "var(--bg-elevated)", marginBottom: "var(--space-lg)", textAlign: "left" }}>
            <div className="field-row">
              <span className="field-label">Application Number</span>
              <span className="field-value-accent" style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700 }}>
                {appId}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Applicant Name</span>
              <span className="field-value">{currentUser.name}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Registered Contact</span>
              <span className="field-value">{currentUser.phone || "—"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Routing Department</span>
              <span className="field-value" style={{ fontWeight: 600, color: "var(--brand-primary)" }}>{info.department}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Target SLA</span>
              <span className="badge badge-neutral">15 Working Days</span>
            </div>
            <div className="field-row">
              <span className="field-label">Initial Status</span>
              <span className="badge badge-info">Submitted • Awaiting Officer Scrutiny</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => router.push("/applications")}>
              📋 Track in My Applications →
            </button>
            <button className="btn btn-secondary" onClick={() => router.push("/services")}>
              Back to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content animate-in">
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ color: "var(--brand-primary)" }}>{info.icon}</span>
            <h1 className="page-title">{info.name}</h1>
          </div>
          <p className="page-subtitle">
            Routing to <strong>{info.department}</strong> • Auto-authenticated as {currentUser.name} ({currentUser.phone})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
        {/* Applicant Verification Card */}
        <div className="card" style={{ marginBottom: "var(--space-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "CI"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {currentUser.phone} • {currentUser.jurisdiction}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "var(--space-md)" }}>
          <h3 className="card-title" style={{ marginBottom: "var(--space-md)" }}>Parcel Information</h3>
          <div style={{ marginBottom: "var(--space-md)" }}>
            <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Parcel ULPIN / ID *</label>
            <input className="input" placeholder="e.g. IN-BR-PTN-0001051 or 1051" value={form.parcel_ulpin} onChange={(e) => setForm({ ...form, parcel_ulpin: e.target.value })} required />
          </div>

          {info.fields.includes("purpose") && (
            <div style={{ marginBottom: "var(--space-md)" }}>
              <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Purpose of Verification *</label>
              <select className="select" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required>
                <option value="purchase">Property Purchase Verification</option>
                <option value="loan">Bank Mortgage / Loan Sanction</option>
                <option value="legal">Legal Court Proceeding</option>
                <option value="personal">Personal Title Records</option>
                <option value="other">Other Statutory Need</option>
              </select>
            </div>
          )}

          {info.fields.includes("building_type") && (
            <>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Proposed Construction Type *</label>
                <select className="select" value={form.building_type} onChange={(e) => setForm({ ...form, building_type: e.target.value })} required>
                  <option value="residential">Residential Building (G+2)</option>
                  <option value="commercial">Commercial Complex</option>
                  <option value="industrial">Light Industrial / Warehouse</option>
                  <option value="institutional">Institutional / Educational</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Proposed Built-up Area (sqm) *</label>
                  <input className="input" type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required />
                </div>
                <div>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Proposed Floors *</label>
                  <input className="input" type="number" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} required />
                </div>
              </div>
            </>
          )}

          {info.fields.includes("new_owner") && (
            <>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Mutation Legal Reason *</label>
                <select className="select" value={form.mutation_reason} onChange={(e) => setForm({ ...form, mutation_reason: e.target.value })} required>
                  <option value="sale">Registered Sale Deed Transfer</option>
                  <option value="inheritance">Inheritance / Succession</option>
                  <option value="gift">Registered Gift Deed</option>
                  <option value="partition">Family Property Partition</option>
                </select>
              </div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Transferee / New Owner Name *</label>
                <input className="input" placeholder="Full Name of Transferee" value={form.new_owner || currentUser.name} onChange={(e) => setForm({ ...form, new_owner: e.target.value })} required />
              </div>
            </>
          )}

          <div style={{ marginTop: "var(--space-md)" }}>
            <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Additional Remarks / Details</label>
            <textarea
              className="input"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Provide any additional deed details, khata / khesra references or instructions..."
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: "var(--space-md)" }}>
              <Lucide.AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ fontWeight: 700 }}>
            {loading ? "Dispatched to Department..." : `Submit Application to ${info.department} →`}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.push("/services")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function ServiceFormPage() {
  return (
    <Suspense fallback={<div className="app-content"><p>Loading application form...</p></div>}>
      <ServiceFormContent />
    </Suspense>
  );
}
