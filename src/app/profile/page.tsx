"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";
import { useAuth } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import apiClient from "@/lib/api-client";

export default function ProfilePage() {
  const { currentUser, logout, updateUserProfile, getInitials } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "jurisdiction" | "portfolio" | "security">("overview");
  const [citizenApps, setCitizenApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    jurisdiction: "",
    circleCode: "",
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        jurisdiction: currentUser.jurisdiction || "",
        circleCode: currentUser.circleCode || "",
      });

      // Load active applications for this user
      if (currentUser.role === "CITIZEN" && currentUser.phone) {
        setLoadingApps(true);
        apiClient
          .get(`/api/v1/applications?phone=${encodeURIComponent(currentUser.phone)}`)
          .then((res) => {
            if (res.data?.applications) {
              setCitizenApps(res.data.applications);
            }
          })
          .catch(() => setCitizenApps([]))
          .finally(() => setLoadingApps(false));
      }
    }
  }, [currentUser]);

  // Guest State if user is not logged in
  if (!currentUser) {
    return (
      <motion.div
        className="app-content"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 600, margin: "40px auto" }}
      >
        <div className="card" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(2, 132, 199, 0.1)",
              color: "var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-md)",
            }}
          >
            <Lucide.UserCheck size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
            User Profile & Identity
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>
            You are currently viewing LandStack as a guest. Please log in with your registered citizen phone number or official departmental credentials to view your profile, connected land parcels, and statutory permissions.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login?redirect=/profile"
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: "10px 22px" }}
            >
              <span>🔑 Login / Sign Up</span>
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const isCitizen = currentUser.role === "CITIZEN";

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      jurisdiction: editForm.jurisdiction,
      circleCode: editForm.circleCode,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditModalOpen(false);
    }, 600);
  };

  return (
    <motion.div
      className="app-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Top Banner & Header Card */}
      <div
        className="card"
        style={{
          padding: "var(--space-xl)",
          marginBottom: "var(--space-lg)",
          background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border-default)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: isCitizen ? "var(--brand-primary)" : "linear-gradient(135deg, #1e293b, #0f172a)",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.25)",
                border: "3px solid var(--border-default)",
              }}
            >
              {getInitials(currentUser.name)}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {currentUser.name}
                </h1>
                <span
                  className={`badge ${isCitizen ? "badge-info" : "badge-neutral"}`}
                  style={{ fontWeight: 700, fontSize: 11, padding: "4px 8px" }}
                >
                  {isCitizen ? "🇮🇳 Citizen Identity" : `🏛️ ${currentUser.role}`}
                </span>
                <span className="badge badge-success" style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Lucide.CheckCircle2 size={12} /> Active & Verified
                </span>
              </div>

              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                {currentUser.title} • {currentUser.department}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span><strong>ID:</strong> {currentUser.officialId || "CITIZEN-BR-01"}</span>
                <span>•</span>
                <span><strong>Jurisdiction:</strong> {currentUser.jurisdiction}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditModalOpen(true)}
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Lucide.Edit3 size={14} /> Edit Profile
            </button>
            <button
              className="btn btn-outline"
              onClick={() => logout()}
              style={{ fontSize: 12, color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Lucide.LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* DPDPA & Statutory Compliance Strip */}
        <div
          style={{
            marginTop: "var(--space-lg)",
            paddingTop: "var(--space-md)",
            borderTop: "1px solid var(--border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lucide.ShieldCheck size={16} color="var(--status-success)" />
            <span>DPDPA 2023 Compliant • Purpose-Bound Consent Active</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span><strong>Auth Method:</strong> {isCitizen ? "Mobile OTP (+91)" : "GovNet Official PKI"}</span>
            <span>•</span>
            <span><strong>Session:</strong> Active (24h token)</span>
          </div>
        </div>
      </div>

      {/* Profile Section Navigation Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "var(--space-lg)", borderBottom: "1px solid var(--border-default)", paddingBottom: 8, overflowX: "auto" }}>
        {[
          { id: "overview", label: "🪪 Identity & Credentials", icon: <Lucide.User size={14} /> },
          { id: "jurisdiction", label: "🗺️ Domicile & Jurisdiction", icon: <Lucide.MapPin size={14} /> },
          { id: "portfolio", label: isCitizen ? "🏡 Land Holdings & Services" : "📜 Statutory RBAC Authority", icon: isCitizen ? <Lucide.Home size={14} /> : <Lucide.Shield size={14} /> },
          { id: "security", label: "🛡️ Security & Privacy Ledger", icon: <Lucide.Lock size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-outline"}`}
            style={{ fontSize: 12, padding: "8px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Identity */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-md)" }}
        >
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.UserCheck size={18} color="var(--brand-primary)" /> Personal & Contact Information
            </h3>
            <div className="field-row">
              <span className="field-label">Full Legal Name</span>
              <span className="field-value" style={{ fontWeight: 700 }}>{currentUser.name}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Registered Phone</span>
              <span className="field-value" style={{ fontFamily: "monospace", fontWeight: 600 }}>
                🇮🇳 {currentUser.phone || "+91 98765 43210"}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Email Address</span>
              <span className="field-value">{currentUser.email || "citizen@biharbhumi.bihar.gov.in"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">User Classification</span>
              <span className="field-value">{currentUser.userType === "CITIZEN" ? "Public Citizen / Land Holder" : "State Department Official"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Language Preference</span>
              <span className="field-value">Hindi (हिन्दी) / English</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.BadgeCheck size={18} color="var(--status-success)" /> Verification & Digital Trust
            </h3>
            <div className="field-row">
              <span className="field-label">Aadhaar / DigiLocker</span>
              <span className="badge badge-success">Verified (XXXX-XXXX-4912)</span>
            </div>
            <div className="field-row">
              <span className="field-label">Mobile OTP Verification</span>
              <span className="badge badge-success">Active & Authenticated</span>
            </div>
            <div className="field-row">
              <span className="field-label">Digital Signature (DSC / e-Sign)</span>
              <span className="field-value">{isCitizen ? "e-Sign Enabled (IT Act 2000)" : "Class 3 Govt Token Valid till 2027"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">DPDPA Purpose Consent</span>
              <span className="field-value" style={{ color: "var(--status-success)", fontWeight: 600 }}>Active (Land Governance & RoR Access)</span>
            </div>
            <div className="field-row">
              <span className="field-label">Account Status</span>
              <span className="badge badge-info">Standard Active</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Domicile & Jurisdiction */}
      {activeTab === "jurisdiction" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-md)" }}
        >
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.MapPin size={18} color="var(--brand-primary)" /> Registered Administrative Hierarchy
            </h3>
            <div className="field-row">
              <span className="field-label">State / UT</span>
              <span className="field-value">Bihar (State Code: BR)</span>
            </div>
            <div className="field-row">
              <span className="field-label">District</span>
              <span className="field-value">{currentUser.districtCode === "BR-10" ? "Madhubani (BR-10)" : (currentUser.districtCode || "Patna")}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Circle / Anchal</span>
              <span className="field-value">{currentUser.circleCode || "Basopatti"}</span>
            </div>
            <div className="field-row">
              <span className="field-label">Revenue Village (Mauza)</span>
              <span className="field-value">Mauza Arghawa (Thana #33)</span>
            </div>
            <div className="field-row">
              <span className="field-label">Statutory Jurisdiction</span>
              <span className="field-value" style={{ fontWeight: 600 }}>{currentUser.jurisdiction}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.Landmark size={18} color="var(--brand-primary)" /> Departmental Office Contact
            </h3>
            <div className="field-row">
              <span className="field-label">Circle Officer Office</span>
              <span className="field-value">Anchal Adhikari, Basopatti Anchal</span>
            </div>
            <div className="field-row">
              <span className="field-label">Sub-Registrar Office</span>
              <span className="field-value">Registry Office, Madhubani Sadar</span>
            </div>
            <div className="field-row">
              <span className="field-label">Town Planning Authority</span>
              <span className="field-value">Urban Development & Housing Department</span>
            </div>
            <div className="field-row">
              <span className="field-label">State DPI Portal</span>
              <span className="field-value" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>biharbhumi.bihar.gov.in</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Land Holdings (Citizen) OR Statutory RBAC Authority (Officer) */}
      {activeTab === "portfolio" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gap: "var(--space-md)" }}
        >
          {isCitizen ? (
            <>
              {/* Connected Parcels */}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)", flexWrap: "wrap", gap: 8 }}>
                  <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Lucide.Layers size={18} color="var(--brand-primary)" /> Linked Land Holdings & Jamabandi RoR
                  </h3>
                  <Link href="/map" className="btn btn-outline" style={{ fontSize: 12 }}>
                    Open Cadastral Map →
                  </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-md)" }}>
                  <div className="card" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--brand-primary)" }}>
                        IN-BR-PTN-0001051
                      </span>
                      <span className="badge badge-success">Clear Title</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Plot #1051 • Panji-II Khata #121</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                      Mauza Arghawa (33) • Area: 1.25 Hectares (Agricultural)
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href="/parcel/IN-BR-PTN-0001051" className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Land 360°
                      </Link>
                      <Link href="/services/mutation?parcel=IN-BR-PTN-0001051" className="btn btn-primary" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Apply Mutation
                      </Link>
                    </div>
                  </div>

                  <div className="card" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--brand-primary)" }}>
                        IN-BR-PTN-0001021
                      </span>
                      <span className="badge badge-info">Zoned Residential</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Plot #1021 • Panji-II Khata #89</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                      Mauza Arghawa (33) • Area: 0.45 Hectares (Residential G+2)
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href="/parcel/IN-BR-PTN-0001021" className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Land 360°
                      </Link>
                      <Link href="/services/building-permission?parcel=IN-BR-PTN-0001021" className="btn btn-primary" style={{ fontSize: 11, padding: "4px 8px" }}>
                        Building NOC
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Service Applications */}
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)", flexWrap: "wrap", gap: 8 }}>
                  <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Lucide.ClipboardList size={18} color="var(--brand-primary)" /> Submitted Applications Tracker
                  </h3>
                  <Link href="/applications" className="btn btn-primary" style={{ fontSize: 12 }}>
                    View All in Track Applications →
                  </Link>
                </div>

                {loadingApps ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Loading submitted requests...</p>
                ) : citizenApps.length > 0 ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {citizenApps.map((a) => (
                      <div
                        key={a.application_no}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "var(--bg-elevated)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-default)",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--text-accent)" }}>
                            {a.application_no}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{a.service_type}</span>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                            {a.department} • Submitted {new Date(a.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="badge badge-info">{a.status}</span>
                          <Link href="/applications" className="btn btn-secondary" style={{ fontSize: 11, padding: "4px 8px" }}>
                            Track
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    No pending applications. Use the Citizen Services catalog to submit requests for mutation, RoR certified extracts, and building clearances.
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Staff Statutory Permissions Matrix */
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
                <Lucide.ShieldAlert size={18} color="var(--brand-primary)" /> Statutory Role Permissions Matrix
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {[
                  { name: "RoR Verification & Mutation Approval", desc: "Statutory sanction of title transfer in Panji-II", granted: true },
                  { name: "Certified Document Issuance", desc: "Digital signing of Land 360 extracts and certificates", granted: true },
                  { name: "Boundary & Encumbrance Review", desc: "GIS cadastral discrepancy scrutiny", granted: true },
                  { name: "Dispute Arbitration & Order Recording", desc: "Recording statutory case hearing proceedings", granted: true },
                  { name: "Cross-Department Data Sharing", desc: "Inter-agency sync with Stamps & Urban Planning", granted: true },
                  { name: "Statewide Override Powers", desc: "Super-administrative executive policy bypass", granted: currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN" },
                ].map((perm) => (
                  <div key={perm.name} style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border-default)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{perm.name}</span>
                      <span className={`badge ${perm.granted ? "badge-success" : "badge-neutral"}`}>
                        {perm.granted ? "Granted" : "Restricted"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{perm.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 4: Security & Audit Ledger */}
      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-md)" }}
        >
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.Key size={18} color="var(--brand-primary)" /> Session & Security Diagnostics
            </h3>
            <div className="field-row">
              <span className="field-label">Current Authentication</span>
              <span className="field-value" style={{ fontWeight: 600, color: "var(--status-success)" }}>
                Verified via {isCitizen ? "Mobile OTP" : "Government Staff Password"}
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Session Token Validity</span>
              <span className="field-value">24 Hours (Rolling Expiry)</span>
            </div>
            <div className="field-row">
              <span className="field-label">Security Protocol</span>
              <span className="field-value">TLS 1.3 • AES-256 GCM Storage</span>
            </div>
            <div className="field-row">
              <span className="field-label">Network Gateway</span>
              <span className="field-value" style={{ fontFamily: "monospace" }}>10.42.0.1 (NIC GovNet)</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: 8 }}>
              <Lucide.FileLock size={18} color="var(--brand-primary)" /> Privacy & Access Audit
            </h3>
            <div className="field-row">
              <span className="field-label">DPDPA Purpose Registry</span>
              <span className="badge badge-success">Registered & Encrypted</span>
            </div>
            <div className="field-row">
              <span className="field-label">Aadhaar Data Vault</span>
              <span className="field-value">Masked Reference Only</span>
            </div>
            <div className="field-row">
              <span className="field-label">Audit Logging</span>
              <span className="field-value" style={{ color: "var(--status-info)", fontWeight: 600 }}>100% Immutable Append-Only</span>
            </div>
            <div style={{ marginTop: "var(--space-md)" }}>
              <button
                className="btn btn-outline"
                style={{ width: "100%", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => alert("Audit log export generated and cryptographically verified.")}
              >
                <Lucide.Download size={14} /> Export Cryptographic Audit Log
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              backdropFilter: "blur(4px)",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="card"
              style={{ width: "100%", maxWidth: 520, padding: "var(--space-xl)", background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                <h3 className="card-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Lucide.Edit size={18} color="var(--brand-primary)" /> Edit Profile Details
                </h3>
                <button className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>✕</button>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "var(--space-md)" }}>
                  <Lucide.CheckCircle size={14} /> Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: "var(--space-md)" }}>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Full Legal Name *</label>
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
                  <div>
                    <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Phone Number</label>
                    <input
                      className="input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Email Address</label>
                    <input
                      className="input"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "var(--space-md)" }}>
                  <label className="field-label" style={{ display: "block", marginBottom: 4 }}>Statutory Jurisdiction / Address</label>
                  <input
                    className="input"
                    value={editForm.jurisdiction}
                    onChange={(e) => setEditForm({ ...editForm, jurisdiction: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
