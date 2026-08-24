"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { useAuth } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import apiClient from "@/lib/api-client";

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SUBMITTED: { label: "Submitted", class: "badge-info" },
  DOCUMENT_VERIFICATION: { label: "Document Verification", class: "badge-info" },
  UNDER_REVIEW: { label: "Under Review", class: "badge-warning" },
  ACTION_REQUIRED: { label: "Action Required", class: "badge-error" },
  APPROVED: { label: "Approved & Certified", class: "badge-success" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-error" },
};

function getSteps(currentStatus: string) {
  const allSteps = ["SUBMITTED", "DOCUMENT_VERIFICATION", "UNDER_REVIEW", "APPROVED", "COMPLETED"];
  const stepLabels = ["Submitted", "Document Verification", "Under Review", "Approved & Certified"];
  
  if (currentStatus === "REJECTED") {
    return [
      { label: "Submitted", status: "completed" },
      { label: "Under Review", status: "completed" },
      { label: "Rejected", status: "current" },
    ];
  }

  const normalized = currentStatus === "COMPLETED" ? "APPROVED" : currentStatus;
  const currentIndex = allSteps.indexOf(normalized);
  return stepLabels.map((label, i) => {
    if (i < currentIndex || (currentStatus === "APPROVED" && i <= 3)) return { label, status: "completed" };
    if (i === currentIndex) return { label, status: "current" };
    return { label, status: "pending" };
  });
}

export default function ApplicationsPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = currentUser?.role || "CITIZEN";

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadApps = async () => {
      try {
        setLoading(true);
        let url = "/api/v1/applications";

        if (currentRole === "CITIZEN") {
          const params = new URLSearchParams();
          if (currentUser.phone) params.set("phone", currentUser.phone);
          if (currentUser.name) params.set("applicant", currentUser.name);
          url = `/api/v1/applications?${params.toString()}`;
        } else if (currentRole === "REGISTRATION_OFFICER") {
          url = "/api/v1/applications?department=Registration";
        } else if (currentRole === "PLANNING_OFFICER") {
          url = "/api/v1/applications?department=Planning";
        } else if (currentRole === "TAX_OFFICER") {
          url = "/api/v1/applications?department=Municipality";
        } else if (currentRole === "REVENUE_OFFICER") {
          url = "/api/v1/applications?department=Revenue";
        }

        const res = await apiClient.get(url);
        if (isMounted) {
          const list = res.data?.applications || [];
          setApplications(list);
          if (list.length > 0) {
            setSelectedId((prev) => prev || list[0].application_no);
          } else {
            setSelectedId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load applications:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadApps();
    return () => {
      isMounted = false;
    };
  }, [currentUser, currentRole]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    let isMounted = true;
    const loadDetail = async () => {
      try {
        const res = await apiClient.get(`/api/v1/applications/${selectedId}`);
        if (isMounted) setSelectedDetail(res.data);
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      }
    };
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // If user is not logged in, prompt to login
  if (!currentUser) {
    return (
      <motion.div
        className="app-content animate-in"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 640, margin: "32px auto" }}
      >
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)", color: "var(--brand-primary)" }}>
            <Lucide.ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            Login Required to Track Applications
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>
            Please log in with your registered Indian mobile number to track the live progress, department review notes, and certificate downloads for your land applications.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login?redirect=/applications"
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: "10px 22px" }}
            >
              <span>🔑 Login to My Applications</span>
            </Link>
            <Link href="/" className="btn btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const app = selectedDetail?.application || applications.find((a) => a.application_no === selectedId);
  const history = selectedDetail?.history || [];

  return (
    <motion.div
      className="app-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>{currentRole === "CITIZEN" ? "📋" : "👨‍💼"}</span>
            <h1 className="page-title">
              {currentRole === "CITIZEN" ? t("apps.title") : `${currentUser?.department || "Department"} ${t("apps.title")}`}
            </h1>
          </div>
          <p className="page-subtitle">
            {currentRole === "CITIZEN"
              ? `Real-time statutory tracking for ${currentUser.name} (${currentUser.phone || "Verified Citizen"})`
              : `Departmental case queue for ${currentUser?.title || "Officer"} (${currentUser?.jurisdiction || "Bihar"})`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentRole === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary">+ Apply for New Service</Link>
          ) : (
            <Link href="/officer" className="btn btn-primary">Open Officer Desk →</Link>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
          <div className="animate-pulse" style={{ fontSize: 24 }}>📄</div>
          <p style={{ marginTop: "var(--space-sm)" }}>Querying real application records from PostgreSQL...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Clean Empty State when no fake data exists */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ textAlign: "center", padding: "var(--space-2xl)", maxWidth: 540, margin: "24px auto" }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)", color: "var(--text-secondary)" }}>
            <Lucide.FileQuestion size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Applications Found</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>
            {currentRole === "CITIZEN"
              ? "You haven't submitted any service requests yet. Choose a service below to get certified land records, mutation, or clearances."
              : "No pending departmental cases in this queue at the moment."}
          </p>
          {currentRole === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary" style={{ fontWeight: 700 }}>
              <span>+ Explore Citizen Services</span>
            </Link>
          ) : (
            <Link href="/officer" className="btn btn-secondary">
              Refresh Departmental Queue
            </Link>
          )}
        </motion.div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: app ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr", gap: "var(--space-md)" }}>
          {/* Application List */}
          <motion.div
            style={{ display: "grid", gap: "var(--space-md)" }}
            initial="initial"
            animate="animate"
            variants={{
              initial: {},
              animate: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {applications.map((a) => {
              const steps = getSteps(a.status);
              const isSelected = selectedId === a.application_no;
              return (
                <motion.div
                  key={a.application_no}
                  variants={{
                    initial: { opacity: 0, y: 12 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="card card-clickable"
                  style={isSelected ? { borderColor: "var(--brand-primary)", boxShadow: "var(--shadow-glow)" } : {}}
                  onClick={() => setSelectedId(a.application_no)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--text-accent)" }}>
                      {a.application_no}
                    </span>
                    <span className={`badge ${STATUS_MAP[a.status]?.class || "badge-neutral"}`}>
                      {STATUS_MAP[a.status]?.label || a.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{a.service_type}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Parcel: {a.parcel_ulpin || "—"} • {a.department}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                    Submitted: {new Date(a.created_at).toLocaleDateString()} • Priority: {a.priority}
                  </div>

                  {/* Progress Steps */}
                  <div className="status-steps" style={{ marginTop: "var(--space-md)" }}>
                    {steps.map((step, i) => (
                      <div key={i} style={{ display: "contents" }}>
                        <div className="status-step">
                          <div className={`status-step-dot ${step.status}`}>
                            {step.status === "completed" ? "✓" : step.status === "current" ? "●" : ""}
                          </div>
                          <div className="status-step-label">{step.label}</div>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`status-step-line ${step.status === "completed" ? "completed" : ""}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Detail Panel */}
          <AnimatePresence>
            {app && (
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="card"
                style={{ height: "fit-content" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>{app.service_type}</h2>
                    <span style={{ fontSize: 13, color: "var(--text-accent)", fontFamily: "monospace" }}>{app.application_no}</span>
                  </div>
                  <button className="btn btn-ghost" onClick={() => setSelectedId(null)}>✕</button>
                </div>

                <div style={{ marginBottom: "var(--space-lg)" }}>
                  {[
                    ["Parcel ULPIN", app.parcel_ulpin || "—"],
                    ["Applicant Name", app.applicant_name],
                    ["Contact Phone", app.applicant_phone || "—"],
                    ["Routing Department", app.department],
                    ["Reviewing Officer", app.assigned_officer || "Circle / Sub-Registrar Desk"],
                    ["Purpose", app.purpose || "—"],
                    ["Submitted On", new Date(app.created_at).toLocaleString()],
                    ["Last Updated", new Date(app.updated_at).toLocaleString()],
                  ].map(([l, v]) => (
                    <div key={l} className="field-row">
                      <span className="field-label">{l}</span>
                      <span className="field-value">{v}</span>
                    </div>
                  ))}
                  <div className="field-row">
                    <span className="field-label">Current Status</span>
                    <span className={`badge ${STATUS_MAP[app.status]?.class || "badge-neutral"}`}>
                      {STATUS_MAP[app.status]?.label || app.status}
                    </span>
                  </div>
                </div>

                {app.parcel_ulpin && (
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                    <Link href={`/parcel/${app.parcel_ulpin}`} className="btn btn-secondary btn-sm">
                      View Parcel Land 360°
                    </Link>
                    <Link href={`/map?parcel=${app.parcel_ulpin}`} className="btn btn-secondary btn-sm">
                      View on Cadastral Map
                    </Link>
                  </div>
                )}

                <h3 className="section-title" style={{ marginTop: "var(--space-lg)" }}>Official Audit Trail</h3>
                <div style={{ marginTop: "var(--space-sm)" }}>
                  {history.length > 0 ? (
                    history.map((h: any, i: number) => (
                      <div key={i} style={{ display: "flex", gap: "var(--space-md)", padding: "var(--space-sm) 0", borderLeft: "2px solid var(--border-default)", paddingLeft: "var(--space-md)", marginLeft: 6, position: "relative" }}>
                        <div style={{ position: "absolute", left: -5, top: 10, width: 8, height: 8, borderRadius: "50%", background: i === history.length - 1 ? "var(--brand-primary)" : "var(--border-strong)" }} />
                        <div>
                          <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{h.action}</div>
                          {h.comments && (
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, fontStyle: "italic", background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: 4 }}>
                              &ldquo;{h.comments}&rdquo;
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                            {new Date(h.created_at).toLocaleString()} • {h.performed_by} ({h.role || h.department || "Staff"})
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Application recorded in state ledger.</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
