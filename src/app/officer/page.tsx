"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  getWorkflowDefinition,
  getCurrentStageIndex,
  calculateSlaStatus,
} from "@/lib/workflow/workflow-engine";
import apiClient from "@/lib/api-client";
import {
  Check,
  CheckCircle2,
  X,
  XCircle,
  AlertTriangle,
  AlertCircle,
  FileText,
  FileSignature,
  Lock,
  Building2,
  ReceiptText,
  FileQuestion,
  Loader2,
  MapPin,
  ExternalLink,
  Clock,
  ShieldAlert,
} from "lucide-react";

const ALL_DEPARTMENTS = [
  "All",
  "Revenue",
  "Registration",
  "Planning",
  "Municipality",
  "Environment",
];

function getAllowedDepartments(role?: string): string[] {
  if (!role || role === "GUEST") return ["Revenue"];
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "AUDITOR") {
    return ALL_DEPARTMENTS;
  }
  if (role === "REVENUE_OFFICER") return ["Revenue"];
  if (role === "REGISTRATION_OFFICER") return ["Registration"];
  if (role === "PLANNING_OFFICER") return ["Planning"];
  if (role === "TAX_OFFICER") return ["Municipality"];
  return ["Revenue"];
}

function checkCanOfficerVerifyApplication(currentUser: any, appDept?: string): boolean {
  if (!currentUser) return false;
  const role = currentUser.role;
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "AUDITOR") return true;

  const targetDept = (appDept || "").toLowerCase();
  if (role === "REVENUE_OFFICER" && targetDept.includes("revenue")) return true;
  if (role === "REGISTRATION_OFFICER" && (targetDept.includes("registration") || targetDept.includes("stamps"))) return true;
  if (role === "PLANNING_OFFICER" && (targetDept.includes("planning") || targetDept.includes("housing"))) return true;
  if (role === "TAX_OFFICER" && (targetDept.includes("municipality") || targetDept.includes("tax"))) return true;

  return false;
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  SUBMITTED: { label: "Submitted", class: "badge-info" },
  DOCUMENT_VERIFICATION: { label: "Doc Verification", class: "badge-info" },
  UNDER_REVIEW: { label: "Under Review", class: "badge-warning" },
  ACTION_REQUIRED: { label: "Action Req", class: "badge-error" },
  APPROVED: { label: "Approved", class: "badge-success" },
  COMPLETED: { label: "Completed", class: "badge-success" },
  REJECTED: { label: "Rejected", class: "badge-error" },
  ESCALATED: { label: "Escalated", class: "badge-error" },
};

export default function OfficerPortal() {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppNo, setSelectedAppNo] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [parcel360, setParcel360] = useState<any | null>(null);

  const allowedDepts = getAllowedDepartments(currentUser?.role);
  const [userSelectedDept, setUserSelectedDept] = useState<string | null>(null);

  // Derive active department cleanly without cascading effect setState
  const selectedDept =
    userSelectedDept && allowedDepts.includes(userSelectedDept)
      ? userSelectedDept
      : allowedDepts[0];
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Action Modal State
  const [modalMode, setModalMode] = useState<
    "APPROVE" | "REJECT" | "REQUEST_INFO" | "ESCALATE" | null
  >(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "prechecks" | "land360" | "history"
  >("overview");

  const fetchApplications = async (deptToFetch?: string) => {
    try {
      const dept = deptToFetch !== undefined ? deptToFetch : selectedDept;
      const url =
        dept === "All"
          ? "/api/v1/applications"
          : `/api/v1/applications?department=${dept}`;
      const res = await apiClient.get(url);
      if (res.data?.applications) {
        setApplications(res.data.applications);
        setSelectedAppNo(
          (prev) => prev || (res.data.applications[0]?.application_no ?? null),
        );
      }
    } catch (err) {
      console.error("Failed to load officer applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (appNo: string) => {
    try {
      const res = await apiClient.get(`/api/v1/applications/${appNo}`);
      setSelectedDetail(res.data);

      if (
        res.data?.application?.parcel_id ||
        res.data?.application?.parcel_ulpin
      ) {
        const pId =
          res.data.application.parcel_id || res.data.application.parcel_ulpin;
        try {
          const pRes = await apiClient.get(`/api/parcels/${pId}`);
          setParcel360(pRes.data);
        } catch {
          setParcel360(null);
        }
      } else {
        setParcel360(null);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const url =
          selectedDept === "All"
            ? "/api/v1/applications"
            : `/api/v1/applications?department=${selectedDept}`;
        const res = await apiClient.get(url);
        if (isMounted && res.data?.applications) {
          setApplications(res.data.applications);
          setSelectedAppNo(
            (prev) => prev || (res.data.applications[0]?.application_no ?? null),
          );
        }
      } catch (err) {
        console.error("Failed to load officer applications:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [selectedDept]);

  useEffect(() => {
    if (!selectedAppNo) return;
    let isMounted = true;
    const loadDetail = async () => {
      try {
        const res = await apiClient.get(`/api/v1/applications/${selectedAppNo}`);
        if (isMounted) {
          setSelectedDetail(res.data);
          if (
            res.data?.application?.parcel_id ||
            res.data?.application?.parcel_ulpin
          ) {
            const pId =
              res.data.application.parcel_id ||
              res.data.application.parcel_ulpin;
            try {
              const pRes = await apiClient.get(`/api/parcels/${pId}`);
              if (isMounted) setParcel360(pRes.data);
            } catch {
              if (isMounted) setParcel360(null);
            }
          } else {
            if (isMounted) setParcel360(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch detail:", err);
      }
    };
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [selectedAppNo]);

  const executeAction = async (
    actionType: "APPROVE" | "REJECT" | "REQUEST_INFO" | "ESCALATE",
    actionComments: string,
    extra?: any,
  ) => {
    if (!selectedAppNo) return;
    try {
      setActionLoading(true);
      const res = await apiClient.patch(
        `/api/v1/applications/${selectedAppNo}`,
        {
          action: actionType,
          officer_name: currentUser?.name || "Land Officer Vikram Singh",
          role: currentUser?.role || "REVENUE_OFFICER",
          department:
            currentUser?.department ||
            (selectedDept === "All"
              ? "Revenue Department"
              : `${selectedDept} Department`),
          comments: actionComments,
          ...extra,
        },
      );

      if (res.status === 200) {
        setModalMode(null);
        setActionRemarks("");
        if (res.data?.application) {
          const updatedApp = res.data.application;
          setSelectedDetail((prev: any) => ({
            ...prev,
            application: updatedApp,
            history: res.data.history || prev?.history,
          }));
          setApplications((prev) =>
            prev.map((item) =>
              item.application_no === updatedApp.application_no
                ? { ...item, ...updatedApp }
                : item,
            ),
          );
        }
        fetchApplications();
        if (selectedAppNo) fetchDetail(selectedAppNo);
      }
    } catch (err) {
      console.error("Failed to execute action:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const app =
    selectedDetail?.application ||
    applications.find((a) => a.application_no === selectedAppNo);
  const history = selectedDetail?.history || [];
  const prechecks = app?.precheck_results || {};

  // Compute Multi-Department Statutory Workflow Pipeline
  const workflow = app ? getWorkflowDefinition(app.service_type) : null;
  const currentStageIdx = workflow
    ? getCurrentStageIndex(workflow, app?.current_step)
    : 0;
  const isFinalStage = workflow
    ? currentStageIdx >= workflow.stages.length - 1
    : true;
  const currentStage = workflow?.stages[currentStageIdx];
  const nextStage =
    workflow && !isFinalStage ? workflow.stages[currentStageIdx + 1] : null;

  const pendingCount = applications.filter((a) =>
    ["SUBMITTED", "UNDER_REVIEW", "DOCUMENT_VERIFICATION"].includes(a.status),
  ).length;
  const approvedCount = applications.filter((a) =>
    ["APPROVED", "COMPLETED"].includes(a.status),
  ).length;
  const breachedCount = applications.filter(
    (a) => a.sla_status === "SLA_BREACHED" || a.escalated,
  ).length;

  return (
    <motion.div
      className="app-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 24 }}>👨‍💼</span>
            <h1 className="page-title">{t("officer.title")}</h1>
          </div>
          <p className="page-subtitle">{t("officer.subtitle")}</p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {currentUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                padding: "6px 12px",
                borderRadius: "var(--radius-md)",
              }}
            >
              <span style={{ fontSize: 16 }}>🏛️</span>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-accent)" }}>
                  {currentUser.title?.split("(")[0]}
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="badge badge-error"
                style={{
                  border: "none",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  fontSize: 10,
                  cursor: "pointer",
                  padding: "3px 6px",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ fontSize: 12 }}
            >
              🔑 Officer Login
            </Link>
          )}
          <Link
            href="/officer/conflicts"
            className="btn btn-outline"
            style={{ fontSize: 12 }}
          >
            ⚠️ {t("nav.conflicts")} ({3})
          </Link>
          <Link
            href="/admin/intelligence"
            className="btn btn-primary"
            style={{ fontSize: 12 }}
          >
            🧠 {t("nav.intelligence")}
          </Link>
        </div>
      </motion.div>

      {/* SLA & Workflow Metrics */}
      <motion.div
        className="stat-grid"
        style={{ marginBottom: "var(--space-lg)" }}
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {[
          {
            icon: "📋",
            value: pendingCount,
            label: t("stat.pending_queue"),
            bg: "var(--status-warning-bg)",
          },
          {
            icon: "⏱️",
            value: applications.filter((a) => a.status === "UNDER_REVIEW")
              .length,
            label: t("stat.in_review"),
            bg: "var(--status-info-bg)",
          },
          {
            icon: "✅",
            value: approvedCount,
            label: t("stat.approved_certified"),
            bg: "var(--status-success-bg)",
          },
          {
            icon: "🚨",
            value: breachedCount,
            label: t("stat.sla_breaches"),
            bg: "var(--status-error-bg)",
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            className="stat-card"
            variants={{
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, transition: { duration: 0.18 } }}
          >
            <div className="stat-icon" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Department Queue Indicator / Filter Tabs */}
      {allowedDepts.length === 1 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-md)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>
              {allowedDepts[0] === "Revenue" && "🌾"}
              {allowedDepts[0] === "Registration" && "📝"}
              {allowedDepts[0] === "Planning" && "📐"}
              {allowedDepts[0] === "Municipality" && "🏛️"}
              {allowedDepts[0] === "Environment" && "🌲"}
            </span>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{allowedDepts[0]} Department Queue</span>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: 10, padding: "2px 8px" }}
                >
                  🔒 Department Isolated View
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                }}
              >
                Designated Officer:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {currentUser?.name || "Official"}
                </strong>{" "}
                ({currentUser?.title?.split("(")[0] || currentUser?.role}) •
                Jurisdiction:{" "}
                {currentUser?.jurisdiction || "Designated Circle / District"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                color: "#16a34a",
                background: "rgba(22, 163, 74, 0.1)",
                padding: "4px 10px",
                borderRadius: 6,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Check size={13} /> Active Statutory Scrutiny Desk
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "var(--space-md)",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: 10,
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {allowedDepts.map((dept) => (
            <button
              key={dept}
              onClick={() => setUserSelectedDept(dept)}
              className={`btn ${selectedDept === dept ? "btn-primary" : "btn-outline"}`}
              style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
            >
              {dept === "Revenue" && "🌾 "}
              {dept === "Registration" && "📝 "}
              {dept === "Planning" && "📐 "}
              {dept === "Municipality" && "🏛️ "}
              {dept === "Environment" && "🌲 "}
              {dept} {dept !== "All" ? "Department" : "Departments (Apex)"}
            </button>
          ))}
        </div>
      )}

      {/* Main 2-Column Interface: Queue on Left, Land 360 Case Viewer on Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: app
            ? "repeat(auto-fit, minmax(320px, 1fr))"
            : "1fr",
          gap: "var(--space-md)",
        }}
      >
        {/* Left: Application Inbox */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Case Inbox</h3>
            <span className="badge badge-neutral">
              {applications.length} cases
            </span>
          </div>

          {loading ? (
            <p
              style={{
                color: "var(--text-secondary)",
                padding: "var(--space-lg)",
                textAlign: "center",
              }}
            >
              Loading departmental queue...
            </p>
          ) : (
            <div className="table-wrap" style={{ border: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Service & Dept</th>
                    <th>Status</th>
                    <th>SLA Target</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => {
                    const sla = calculateSlaStatus(
                      a.created_at,
                      a.target_sla_days || 5,
                    );
                    const isSelected = selectedAppNo === a.application_no;
                    return (
                      <tr
                        key={a.application_no}
                        style={{
                          cursor: "pointer",
                          background: isSelected
                            ? "var(--brand-gradient-subtle)"
                            : undefined,
                          borderLeft: isSelected
                            ? "3px solid var(--brand-primary)"
                            : "3px solid transparent",
                        }}
                        onClick={() => setSelectedAppNo(a.application_no)}
                      >
                        <td>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 12,
                              color: "var(--text-accent)",
                              fontWeight: 700,
                            }}
                          >
                            {a.application_no}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {a.applicant_name}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {a.service_type}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-secondary)",
                            }}
                          >
                            🏢 {a.department}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${STATUS_MAP[a.status]?.class || "badge-neutral"}`}
                            style={{ fontSize: 10 }}
                          >
                            {STATUS_MAP[a.status]?.label || a.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${sla.badgeClass}`}
                            style={{ fontSize: 10 }}
                          >
                            {a.escalated
                              ? "🚨 Escalated"
                              : sla.status === "SLA_BREACHED"
                                ? "🔴 Breached"
                                : sla.status === "APPROACHING_SLA"
                                  ? "🟡 Due Soon"
                                  : "🟢 On Track"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Land-Aware Officer Case & Compliance Viewer */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {app ? (
            <>
              {/* Header Info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 800 }}>
                      {app.application_no}
                    </span>
                    <span
                      className={`badge ${STATUS_MAP[app.status]?.class || "badge-neutral"}`}
                    >
                      {app.status}
                    </span>
                    {app.escalated && (
                      <span className="badge badge-error">
                        🚨 ESCALATED TO DEPT HEAD
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      marginTop: 2,
                    }}
                  >
                    <strong>{app.service_type}</strong> • Applicant:{" "}
                    {app.applicant_name} ({app.applicant_phone || ""})
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Linked Parcel ULPIN:
                  </div>
                  <Link
                    href={`/map?parcel=${app.parcel_id || ""}`}
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: "4px 8px", marginTop: 2 }}
                  >
                    🗺️ {app.parcel_ulpin || "View on GIS Map"}
                  </Link>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: 8,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                {[
                  { id: "overview", label: "Overview & GIS" },
                  { id: "prechecks", label: "Automated Pre-Checks" },
                  { id: "land360", label: "Land 360 Records" },
                  { id: "history", label: "Audit Timeline" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`btn ${activeTab === t.id ? "btn-primary" : "btn-outline"}`}
                    style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {/* Inter-Department Statutory Pipeline Tracker */}
                  {workflow && (
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--text-accent)",
                          }}
                        >
                          🏛️ Inter-Department Statutory Pipeline (
                          {workflow.stages.length} Stages)
                        </div>
                        <span
                          className={`badge ${
                            app.status === "APPROVED" || app.status === "COMPLETED"
                              ? "badge-success"
                              : app.status === "REJECTED"
                                ? "badge-error"
                                : "badge-info"
                          }`}
                          style={{ fontSize: 10 }}
                        >
                          {app.status === "APPROVED" || app.status === "COMPLETED"
                            ? "✓ All Stages Approved"
                            : app.status === "REJECTED"
                              ? `✕ Rejected at Stage ${currentStageIdx + 1} (${workflow.stages[currentStageIdx]?.deptCode || app.department})`
                              : `SLA: ${workflow.totalSlaDays} Days`}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {workflow.stages.map((stg, i) => {
                          const isRejected = app.status === "REJECTED";
                          const isApproved =
                            app.status === "APPROVED" ||
                            app.status === "COMPLETED";

                          const isStageApproved =
                            isApproved || i < currentStageIdx;
                          const isStageRejected =
                            isRejected && i === currentStageIdx;
                          const isStageActive =
                            !isApproved && !isRejected && i === currentStageIdx;
                          const isStageHalted =
                            isRejected && i > currentStageIdx;

                          return (
                            <div
                              key={stg.stage}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
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
                                  ? "1px solid rgba(239, 68, 68, 0.35)"
                                  : isStageActive
                                    ? "1px solid var(--brand-primary)"
                                    : isStageApproved
                                      ? "1px solid rgba(16, 185, 129, 0.25)"
                                      : "1px solid var(--border-color)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isStageApproved
                                      ? "var(--status-success)"
                                      : isStageRejected
                                        ? "var(--status-error, #ef4444)"
                                        : isStageActive
                                          ? "var(--brand-primary)"
                                          : "var(--border-color)",
                                    color: "#fff",
                                  }}
                                >
                                  {isStageApproved
                                    ? "✓"
                                    : isStageRejected
                                      ? "✕"
                                      : stg.stage}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: 12,
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
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(130px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 10,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{ fontSize: 11, color: "var(--text-secondary)" }}
                      >
                        Purpose of Request
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {app.purpose || "Statutory compliance"}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 10,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{ fontSize: 11, color: "var(--text-secondary)" }}
                      >
                        Current Reviewing Desk
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-accent)",
                        }}
                      >
                        📍 {app.department}
                      </div>
                    </div>
                  </div>

                  {/* Parcel Metadata Snapshot */}
                  {parcel360?.parcel && (
                    <div
                      style={{
                        background: "var(--bg-secondary)",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 8,
                          color: "var(--text-accent)",
                        }}
                      >
                        📍 Linked Cadastral Parcel Snapshot
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(100px, 1fr))",
                          gap: 8,
                          fontSize: 11,
                        }}
                      >
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Survey No:
                          </span>{" "}
                          <strong>{parcel360.parcel.survey_number}</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Area:
                          </span>{" "}
                          <strong>
                            {Number(parcel360.parcel.area).toLocaleString()} sqm
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            Land Use:
                          </span>{" "}
                          <strong>{parcel360.parcel.land_type}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Escalation Alert if Breached */}
                  {app.escalated && (
                    <div
                      style={{
                        background: "var(--status-error-bg)",
                        border: "1px solid var(--status-error)",
                        padding: 12,
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "var(--status-error)",
                          fontSize: 12,
                        }}
                      >
                        🚨 SLA Breach & Escalation Note:
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-primary)",
                          marginTop: 4,
                        }}
                      >
                        {app.escalation_reason}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Automated Pre-Checks (Step 13 / 14) */}
              {activeTab === "prechecks" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-accent)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ShieldAlert size={14} /> Automated Decision-Support
                    Pre-Checks
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {[
                      {
                        label: "Ownership Title & Raiyat Match",
                        status: prechecks.ownership_match !== false,
                        passMsg: "Verified against Bihar Bhumi RoR",
                        failMsg: "Name mismatch detected",
                      },
                      {
                        label: "Spatial Land-Use Zoning Compatibility",
                        status: prechecks.land_use_match !== false,
                        passMsg: "Permitted under Master Plan 2035",
                        failMsg: "Zoning conflict with Master Plan",
                      },
                      {
                        label: "Environmental & Flood Buffer Clearance",
                        status:
                          !prechecks.flood_buffer_conflict &&
                          !prechecks.flood_zone_flag,
                        passMsg: "Outside flood and forest buffer zones",
                        failMsg:
                          "Parcel intersects protected river buffer zone",
                      },
                      {
                        label: "Active Dispute / Court Stay Order Check",
                        status: !prechecks.dispute_flag,
                        passMsg: "No active civil court stay registered",
                        failMsg: "Active title suit pending in Civil Court",
                      },
                      {
                        label: "Bank Mortgage & Encumbrance Clearance",
                        status: !prechecks.encumbrance_flag,
                        passMsg: "Clear title with zero active attachments",
                        failMsg: "Active commercial bank charge registered",
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "var(--bg-secondary)",
                          padding: "8px 12px",
                          borderRadius: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {c.label}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: c.status
                                ? "var(--status-success)"
                                : "var(--status-error)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            {c.status ? (
                              <Check size={11} strokeWidth={2.5} />
                            ) : (
                              <AlertTriangle size={11} />
                            )}
                            <span>{c.status ? c.passMsg : c.failMsg}</span>
                          </div>
                        </div>
                        <span
                          className={`badge ${c.status ? "badge-success" : "badge-error"}`}
                          style={{ fontSize: 10 }}
                        >
                          {c.status ? "PASS" : "REQUIRES REVIEW"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Land 360 Records */}
              {activeTab === "land360" && (
                <div
                  style={{
                    maxHeight: 280,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div className="field-row">
                    <span
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <FileText size={13} color="var(--brand-primary)" />{" "}
                      Jamabandi RoR Owner
                    </span>
                    <span className="field-value">
                      {parcel360?.ror?.raiyat_name ||
                        parcel360?.owners?.[0]?.name ||
                        "Rameshwar Prasad Yadav"}
                    </span>
                  </div>
                  <div className="field-row">
                    <span
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <FileSignature size={13} color="var(--brand-primary)" />{" "}
                      Registered Transactions
                    </span>
                    <span className="field-value">
                      {parcel360?.registrations?.length || 1} Deeds on record
                    </span>
                  </div>
                  <div className="field-row">
                    <span
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Lock size={13} color="var(--brand-primary)" /> Active
                      Encumbrances
                    </span>
                    <span className="field-value">
                      {parcel360?.encumbrances?.length || 0} active charges
                    </span>
                  </div>
                  <div className="field-row">
                    <span
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Building2 size={13} color="var(--brand-primary)" />{" "}
                      Building Permissions
                    </span>
                    <span className="field-value">
                      {parcel360?.building_permissions?.length || 0} permits
                    </span>
                  </div>
                  <div className="field-row">
                    <span
                      className="field-label"
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <ReceiptText size={13} color="var(--brand-primary)" />{" "}
                      Property Tax Status
                    </span>
                    <span
                      className="field-value"
                      style={{ color: "var(--status-success)" }}
                    >
                      PAID_UP_TO_DATE
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 4: Immutable Audit Timeline (Step 13) */}
              {activeTab === "history" && (
                <div
                  style={{
                    maxHeight: 280,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {history.map((h: any) => (
                    <div
                      key={h.history_id}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 11,
                        borderLeft: "2px solid var(--brand-primary)",
                        paddingLeft: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{h.action}</div>
                        <div
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: 10,
                          }}
                        >
                          By: {h.performed_by} ({h.role || "SYSTEM"}) •{" "}
                          {new Date(h.created_at).toLocaleString()}
                        </div>
                        {h.comments && (
                          <div
                            style={{
                              color: "var(--text-accent)",
                              marginTop: 2,
                            }}
                          >
                            &ldquo;{h.comments}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons with Department Jurisdiction & Terminal Status Enforcement */}
              {["APPROVED", "COMPLETED"].includes(app.status) ? (
                <div
                  style={{
                    padding: "16px 20px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#10b981",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: "#065f46",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>Final Statutory Sanction Granted & Order Certified</span>
                        <span
                          className="badge badge-success"
                          style={{ fontSize: 10, padding: "2px 8px" }}
                        >
                          Order Active
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          marginTop: 2,
                        }}
                      >
                        {app.current_step ||
                          "All departmental statutory clearances and title verifications completed."}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/applications"
                    className="btn btn-outline"
                    style={{
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FileSignature size={14} /> View Digital Certificate
                  </Link>
                </div>
              ) : app.status === "REJECTED" ? (
                <div
                  style={{
                    padding: "16px 20px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#ef4444",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#991b1b",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>Application Statutorily Rejected</span>
                      <span
                        className="badge badge-error"
                        style={{ fontSize: 10, padding: "2px 8px" }}
                      >
                        Closed
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        marginTop: 2,
                      }}
                    >
                      {app.current_step ||
                        "Rejected by reviewing authority due to statutory non-compliance."}
                    </div>
                  </div>
                </div>
              ) : checkCanOfficerVerifyApplication(currentUser, app.department) ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--border-color)",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      minWidth: 200,
                      fontSize: 12,
                      justifyContent: "center",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 700,
                    }}
                    onClick={() => setModalMode("APPROVE")}
                    disabled={actionLoading}
                  >
                    <Check size={14} />
                    <span>
                      {!isFinalStage && nextStage
                        ? `Approve & Route to ${nextStage.deptCode} →`
                        : "Grant Final Statutory Sanction"}
                    </span>
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{
                      fontSize: 12,
                      color: "var(--status-warning)",
                      borderColor: "var(--status-warning)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onClick={() => setModalMode("REQUEST_INFO")}
                    disabled={actionLoading}
                  >
                    <FileQuestion size={14} /> Request Info
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{
                      fontSize: 12,
                      color: "var(--status-error)",
                      borderColor: "var(--status-error)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onClick={() => setModalMode("REJECT")}
                    disabled={actionLoading}
                  >
                    <X size={14} /> Reject
                  </button>
                  {app.sla_status === "SLA_BREACHED" && !app.escalated && (
                    <button
                      className="btn btn-outline"
                      style={{
                        fontSize: 12,
                        color: "var(--status-error)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onClick={() => setModalMode("ESCALATE")}
                      disabled={actionLoading}
                    >
                      <AlertTriangle size={14} /> Escalate SLA
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: "14px 16px",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <Lock
                    size={18}
                    color="#d97706"
                    style={{ marginTop: 2, flexShrink: 0 }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "var(--text-secondary)",
                    }}
                  >
                    <strong
                      style={{
                        color: "#d97706",
                        display: "block",
                        marginBottom: 2,
                        fontSize: 13,
                      }}
                    >
                      🔒 Inter-Department Jurisdiction Lock (Read-Only Inspection)
                    </strong>
                    This application is currently assigned to{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {app.department}
                    </strong>{" "}
                    for statutory scrutiny and sanction.
                  </div>
                </div>
              )}
            </>
          ) : (
            <p
              style={{
                color: "var(--text-secondary)",
                textAlign: "center",
                padding: "var(--space-2xl)",
              }}
            >
              Select an application from the queue to inspect parcel compliance
              and take action.
            </p>
          )}
        </div>
      </div>

      {/* Action Remark Modal */}
      <AnimatePresence>
        {modalMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="card"
              style={{
                width: 480,
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              }}
            >
              <h3
                className="card-title"
                style={{
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {modalMode === "APPROVE" && (
                  <>
                    <Check size={16} color="var(--status-success)" />
                    {!isFinalStage && nextStage
                      ? `Approve & Forward to ${nextStage.department}`
                      : "Grant Final Statutory Sanction & Order"}
                  </>
                )}
                {modalMode === "REJECT" && (
                  <>
                    <X size={16} color="var(--status-error)" /> Reject
                    Application (Mandatory Reason)
                  </>
                )}
                {modalMode === "REQUEST_INFO" && (
                  <>
                    <FileQuestion size={16} color="var(--status-warning)" />{" "}
                    Request Additional Documentation
                  </>
                )}
                {modalMode === "ESCALATE" && (
                  <>
                    <AlertTriangle size={16} color="var(--status-error)" />{" "}
                    Escalate SLA Breach to Supervisor
                  </>
                )}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  marginBottom: 14,
                }}
              >
                {modalMode === "APPROVE" &&
                  (!isFinalStage && nextStage
                    ? `This application will be approved at ${currentStage?.name || "current stage"} and automatically dispatched to the ${nextStage.department} for Stage ${nextStage.stage} verification.`
                    : "Final statutory sanction will be granted and digital certificate issued to the citizen.")}
                {modalMode === "REJECT" &&
                  "Government guidelines require a clear, legally sound reason for rejecting citizen applications."}
                {modalMode === "REQUEST_INFO" &&
                  "Specify exactly what documents or clarifications are required from the citizen."}
                {modalMode === "ESCALATE" &&
                  "Describe why the case exceeded statutory turnaround limits."}
              </p>

              <textarea
                style={{
                  width: "100%",
                  height: 100,
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  padding: 8,
                  fontSize: 12,
                  marginBottom: 16,
                }}
                placeholder={
                  modalMode === "REJECT"
                    ? "Enter specific statutory grounds for rejection (or leave default)..."
                    : "Enter remarks or statutory verification notes..."
                }
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
              />

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setModalMode(null);
                    setActionRemarks("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${modalMode === "REJECT" ? "btn-danger" : "btn-primary"}`}
                  style={
                    modalMode === "REJECT"
                      ? {
                          background: "#dc2626",
                          borderColor: "#b91c1c",
                          color: "#ffffff",
                          fontWeight: 700,
                        }
                      : undefined
                  }
                  disabled={actionLoading}
                  onClick={() => {
                    if (modalMode === "APPROVE")
                      executeAction(
                        "APPROVE",
                        actionRemarks ||
                          "Stage scrutiny completed and verified.",
                      );
                    if (modalMode === "REJECT")
                      executeAction(
                        "REJECT",
                        actionRemarks ||
                          "Application rejected due to statutory document non-compliance / failed scrutiny.",
                      );
                    if (modalMode === "REQUEST_INFO")
                      executeAction(
                        "REQUEST_INFO",
                        actionRemarks || "Additional documentation required.",
                      );
                    if (modalMode === "ESCALATE")
                      executeAction(
                        "ESCALATE",
                        actionRemarks || "Statutory SLA turnaround breach",
                        { escalated: true, escalation_reason: actionRemarks },
                      );
                  }}
                >
                  {actionLoading
                    ? "Processing..."
                    : modalMode === "REJECT"
                      ? "Confirm & Reject Application"
                      : "Confirm & Route Action"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
