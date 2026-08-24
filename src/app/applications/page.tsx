"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { useAuth } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { getWorkflowDefinition, getCurrentStageIndex } from "@/lib/workflow/workflow-engine";
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

function getSteps(serviceType: string, currentStatus: string, currentStep?: string) {
  const workflow = getWorkflowDefinition(serviceType);
  const currentStageIdx = getCurrentStageIndex(workflow, currentStep);

  if (currentStatus === "REJECTED") {
    return workflow.stages.map((stage, i) => {
      if (i < currentStageIdx) {
        return {
          label: `${stage.deptCode}: Approved`,
          status: "completed",
          symbol: "✓",
          lineClass: i < currentStageIdx - 1 ? "completed" : "rejected",
        };
      }
      if (i === currentStageIdx) {
        return {
          label: `${stage.deptCode}: Rejected`,
          status: "rejected",
          symbol: "✕",
          lineClass: "",
        };
      }
      return {
        label: `${stage.deptCode}: Halted`,
        status: "halted",
        symbol: "—",
        lineClass: "",
      };
    });
  }

  const isApproved = currentStatus === "APPROVED" || currentStatus === "COMPLETED";

  return workflow.stages.map((stage, i) => {
    if (isApproved || i < currentStageIdx) {
      return {
        label: `${stage.deptCode}: Approved`,
        status: "completed",
        symbol: "✓",
        lineClass: "completed",
      };
    }
    if (i === currentStageIdx) {
      return {
        label: `${stage.deptCode}: In Review`,
        status: "current",
        symbol: "●",
        lineClass: "",
      };
    }
    return {
      label: `${stage.deptCode}: Pending`,
      status: "pending",
      symbol: `${stage.stage}`,
      lineClass: "",
    };
  });
}

export default function ApplicationsPage() {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const currentRole = currentUser?.role || "CITIZEN";

  useEffect(() => {
    // When user is logged out, do NOT auto-load applications
    if (!currentUser) {
      setApplications([]);
      setSelectedId(null);
      setSelectedDetail(null);
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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await apiClient.get(`/api/v1/applications?application_no=${encodeURIComponent(searchTerm.trim())}`);
      const found = res.data?.applications || [];
      if (found.length > 0) {
        setApplications(found);
        setSelectedId(found[0].application_no);
      } else {
        setApplications([]);
        setSelectedId(null);
        setSearchError(`No application found matching "${searchTerm.trim()}". Please verify your Application Number.`);
      }
    } catch {
      setSearchError("Failed to search application. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

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
            <span style={{ fontSize: 24 }}>{!currentUser ? "📋" : currentRole === "CITIZEN" ? "📋" : "👨‍💼"}</span>
            <h1 className="page-title">
              {!currentUser ? t("apps.title") : currentRole === "CITIZEN" ? t("apps.title") : `${currentUser?.department || "Department"} ${t("apps.title")}`}
            </h1>
          </div>
          <p className="page-subtitle">
            {!currentUser
              ? "Public statutory tracker: Track your application status with your Application Number"
              : currentRole === "CITIZEN"
                ? `Real-time statutory tracking for ${currentUser.name} (${currentUser.phone || "Verified Citizen"})`
                : `Departmental case queue for ${currentUser?.title || "Officer"} (${currentUser?.jurisdiction || "Bihar"})`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!currentUser ? (
            <Link href="/login?redirect=/applications" className="btn btn-primary"><span>🔑 Login to View All</span></Link>
          ) : currentRole === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary">+ Apply for New Service</Link>
          ) : (
            <Link href="/officer" className="btn btn-primary">Open Officer Desk →</Link>
          )}
        </div>
      </motion.div>

      {/* Interactive Search Bar for Public & Logged-in tracking */}
      <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, marginBottom: "var(--space-lg)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            className="input"
            placeholder="Enter Application Number (e.g. MUT-2026-0042) or Parcel ULPIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, fontSize: 13 }}
          />
          <Lucide.Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={searchLoading} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, whiteSpace: "nowrap" }}>
          {searchLoading ? <Lucide.Loader2 size={16} className="animate-spin" /> : <Lucide.Search size={16} />}
          Track Status
        </button>
      </form>

      {searchError && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-md)" }}>
          <Lucide.AlertTriangle size={14} /> {searchError}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--text-secondary)" }}>
          <div className="animate-pulse" style={{ fontSize: 24 }}>📄</div>
          <p style={{ marginTop: "var(--space-sm)" }}>Querying application records...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Clean Empty State when logged out or no search results */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ textAlign: "center", padding: "var(--space-2xl)", maxWidth: 580, margin: "24px auto" }}
        >
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-md)", color: "var(--text-secondary)" }}>
            <Lucide.Search size={28} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            {!currentUser ? "Track Your Land Application" : "No Applications Found"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>
            {!currentUser
              ? "Enter your statutory Application Number above to track live verification, department approvals, and SLA progress. Or log in with your citizen mobile number to view all your applications."
              : currentRole === "CITIZEN"
                ? "You haven't submitted any service requests yet. Choose a service below to get certified land records, mutation, or clearances."
                : "No pending departmental cases in this queue at the moment."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {!currentUser ? (
              <>
                <Link href="/login?redirect=/applications" className="btn btn-primary" style={{ fontWeight: 700, padding: "8px 18px" }}>
                  <span>🔑 Login to View All My Applications</span>
                </Link>
                <Link href="/services" className="btn btn-secondary">
                  + Explore Services
                </Link>
              </>
            ) : currentRole === "CITIZEN" ? (
              <Link href="/services" className="btn btn-primary" style={{ fontWeight: 700 }}>
                <span>+ Explore Citizen Services</span>
              </Link>
            ) : (
              <Link href="/officer" className="btn btn-secondary">
                Refresh Departmental Queue
              </Link>
            )}
          </div>
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
              const steps = getSteps(a.service_type, a.status, a.current_step);
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
                    Parcel: {a.parcel_ulpin || "—"} • <strong>{a.department}</strong>
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
                            {step.symbol}
                          </div>
                          <div className="status-step-label">{step.label}</div>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`status-step-line ${step.lineClass || (step.status === "completed" ? "completed" : "")}`} />
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

                {/* Multi-Department Statutory Journey Box */}
                {(() => {
                  const wf = getWorkflowDefinition(app.service_type);
                  const curIdx = getCurrentStageIndex(wf, app.current_step);
                  const isRejected = app.status === "REJECTED";
                  const isApproved =
                    app.status === "APPROVED" || app.status === "COMPLETED";

                  return (
                    <div
                      style={{
                        background: "var(--bg-elevated)",
                        padding: "14px 16px",
                        borderRadius: 8,
                        border: "1px solid var(--border-default)",
                        marginBottom: "var(--space-md)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--brand-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span>🏛️ Statutory Inter-Department Flow</span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-tertiary)",
                            }}
                          >
                            ({wf.stages.length} Stages)
                          </span>
                        </div>
                        <span
                          className={`badge ${
                            isApproved
                              ? "badge-success"
                              : isRejected
                                ? "badge-error"
                                : "badge-info"
                          }`}
                          style={{ fontSize: 10, padding: "2px 8px" }}
                        >
                          {isApproved
                            ? "✓ All Stages Approved"
                            : isRejected
                              ? `✕ Rejected by Stage ${curIdx + 1} (${wf.stages[curIdx]?.deptCode || app.department})`
                              : `Active at Stage ${curIdx + 1}`}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {wf.stages.map((stg, i) => {
                          const isStageApproved = isApproved || i < curIdx;
                          const isStageRejected = isRejected && i === curIdx;
                          const isStageActive =
                            !isApproved && !isRejected && i === curIdx;
                          const isStageHalted = isRejected && i > curIdx;

                          return (
                            <div
                              key={stg.stage}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 12,
                                padding: "8px 12px",
                                borderRadius: 6,
                                background: isStageRejected
                                  ? "rgba(239, 68, 68, 0.08)"
                                  : isStageApproved
                                    ? "rgba(16, 185, 129, 0.06)"
                                    : isStageActive
                                      ? "rgba(2, 132, 199, 0.08)"
                                      : "transparent",
                                border: isStageRejected
                                  ? "1px solid rgba(239, 68, 68, 0.4)"
                                  : isStageActive
                                    ? "1px solid var(--brand-primary)"
                                    : isStageApproved
                                      ? "1px solid rgba(16, 185, 129, 0.25)"
                                      : "1px solid var(--border-default)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <span
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: isStageApproved
                                      ? "var(--status-success)"
                                      : isStageRejected
                                        ? "var(--status-error, #ef4444)"
                                        : isStageActive
                                          ? "var(--brand-primary)"
                                          : "var(--border-strong)",
                                    color: "#fff",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                >
                                  {isStageApproved
                                    ? "✓"
                                    : isStageRejected
                                      ? "✕"
                                      : stg.stage}
                                </span>
                                <div>
                                  <div
                                    style={{
                                      fontWeight:
                                        isStageActive || isStageRejected
                                          ? 700
                                          : 600,
                                      color: isStageRejected
                                        ? "#b91c1c"
                                        : isStageActive
                                          ? "var(--text-primary)"
                                          : isStageApproved
                                            ? "#047857"
                                            : "var(--text-secondary)",
                                    }}
                                  >
                                    Stage {stg.stage}: {stg.department}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-tertiary)",
                                    }}
                                  >
                                    {stg.name}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`badge ${
                                  isStageApproved
                                    ? "badge-success"
                                    : isStageRejected
                                      ? "badge-error"
                                      : isStageActive
                                        ? "badge-warning"
                                        : "badge-neutral"
                                }`}
                                style={{ fontSize: 10, padding: "3px 8px" }}
                              >
                                {isStageApproved
                                  ? `✓ Approved by ${stg.deptCode}`
                                  : isStageRejected
                                    ? `✕ Rejected by ${stg.deptCode}`
                                    : isStageActive
                                      ? `⏱️ In Review (${stg.deptCode})`
                                      : isStageHalted
                                        ? "🚫 Halted"
                                        : "Pending"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ marginBottom: "var(--space-lg)" }}>
                  {[
                    ["Parcel ULPIN", app.parcel_ulpin || "—"],
                    ["Applicant Name", app.applicant_name],
                    ["Contact Phone", app.applicant_phone || "—"],
                    ["Active Reviewing Desk", app.department],
                    ["Assigned Officer", app.assigned_officer || "Pending Stage Assignment"],
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
