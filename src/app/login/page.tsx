"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_PERSONAS, UserPersona, getLucideIcon } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import * as Lucide from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, loginAs, loginWithOtp, loginOfficial } = useAuth();
  const { t } = useLanguage();

  // Auth Mode: "CITIZEN" (OTP) | "OFFICIAL" (Official ID)
  const [activePortal, setActivePortal] = useState<"CITIZEN" | "OFFICIAL">("CITIZEN");

  // Citizen OTP States
  const [phone, setPhone] = useState("9876543210");
  const [otpStep, setOtpStep] = useState<"INPUT_PHONE" | "ENTER_OTP">("INPUT_PHONE");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>("483921");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Official Login States
  const [officialId, setOfficialId] = useState("REV-001");
  const [password, setPassword] = useState("••••••••");
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);

  // Selected persona for quick preview
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(currentUser);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Citizen Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Failed to dispatch OTP.");
        setOtpLoading(false);
        return;
      }

      setSimulatedOtp(data.simulated_code || "483921");
      setResendCooldown(30);
      setOtpStep("ENTER_OTP");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpLoading(false);
    } catch {
      setOtpError("Network error sending OTP. Please check connection.");
      setOtpLoading(false);
    }
  };

  // Handle individual OTP box typing
  const handleOtpDigitChange = (index: number, value: string) => {
    const val = value.slice(-1).replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto focus next box
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Auto-fill simulated OTP
  const handleAutoFillOtp = () => {
    if (!simulatedOtp) return;
    const digits = simulatedOtp.slice(0, 6).split("");
    setOtpDigits(digits);
    handleVerifyOtp(simulatedOtp);
  };

  // Citizen Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    const res = await loginWithOtp(phone, code, "Ramesh Kumar");
    if (!res.success) {
      setOtpError(res.error || "Incorrect OTP. Please try again.");
      setOtpLoading(false);
      return;
    }

    setAuthFeedback("✓ Mobile Verified. Redirecting to Citizen Portal...");
    setTimeout(() => {
      router.push("/");
    }, 400);
  };

  // Official Login Submit
  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialId) {
      setOfficialError("Official ID or Email is required.");
      return;
    }

    setOfficialLoading(true);
    setOfficialError(null);

    const res = await loginOfficial(officialId, password);
    if (!res.success) {
      setOfficialError(res.error || "Authentication failed. Please verify credentials.");
      setOfficialLoading(false);
      return;
    }

    const matched = DEMO_PERSONAS.find(
      (p) => p.officialId.toLowerCase() === officialId.toLowerCase() || p.id === officialId
    );

    setAuthFeedback(`✓ Welcome, ${matched?.name || "Officer"} [${matched?.jurisdiction || "Bihar"}]`);
    setTimeout(() => {
      router.push(matched?.landingUrl || "/officer");
    }, 400);
  };

  // Quick 1-click login for Judge / Evaluation Persona
  const handleQuickPersonaSelect = (persona: UserPersona) => {
    setSelectedPersona(persona);
    setAuthFeedback(`Authenticating ${persona.name} (${persona.role})...`);
    loginAs(persona.id);

    setTimeout(() => {
      setAuthFeedback(`✓ Access Granted: ${persona.title} [${persona.jurisdiction}]`);
      setTimeout(() => {
        router.push(persona.landingUrl);
      }, 350);
    }, 300);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-app, #f8fafc)", color: "var(--text-primary, #0f172a)", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Top Bar with Emblem and Language */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-primary, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)" }}>
            <Lucide.Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: "#0f172a" }}>LANDSTACK</div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Digital Public Infrastructure for Land Governance • SIH 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LanguageSelector variant="compact" />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px 64px" }}>
        {/* Title Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", padding: "4px 12px", borderRadius: 20, color: "#0284c7", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
            <Lucide.ShieldCheck size={14} /> NIC e-Pramaan & Multi-Role RBAC / ABAC Framework
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Secure Land Governance Access Portal
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 640, margin: "0 auto", lineHeight: 1.5 }}>
            Separate, specialized onboarding pipelines for Indian Citizens and Departmental Revenue, Registration & Planning Officials.
          </p>

          {authFeedback && (
            <div style={{ marginTop: 14, background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, display: "inline-block", animation: "fadeIn 0.2s ease" }}>
              {authFeedback}
            </div>
          )}
        </div>

        {/* Dual Portal Container */}
        <div style={{ maxWidth: 540, margin: "0 auto", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.06)" }}>
          {/* Portal Selector Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <button
              onClick={() => {
                setActivePortal("CITIZEN");
                setOtpError(null);
                setOfficialError(null);
              }}
              style={{
                padding: "14px 16px",
                border: "none",
                background: activePortal === "CITIZEN" ? "#ffffff" : "transparent",
                color: activePortal === "CITIZEN" ? "#0284c7" : "#64748b",
                fontWeight: activePortal === "CITIZEN" ? 800 : 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom: activePortal === "CITIZEN" ? "2px solid #0284c7" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Lucide.User size={16} />
              <span>1. Citizen Self-Service</span>
            </button>

            <button
              onClick={() => {
                setActivePortal("OFFICIAL");
                setOtpError(null);
                setOfficialError(null);
              }}
              style={{
                padding: "14px 16px",
                border: "none",
                background: activePortal === "OFFICIAL" ? "#ffffff" : "transparent",
                color: activePortal === "OFFICIAL" ? "#0284c7" : "#64748b",
                fontWeight: activePortal === "OFFICIAL" ? 800 : 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom: activePortal === "OFFICIAL" ? "2px solid #0284c7" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Lucide.Landmark size={16} />
              <span>2. Department Official</span>
            </button>
          </div>

          {/* Tab 1: Citizen Mobile OTP Login */}
          {activePortal === "CITIZEN" && (
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>PUBLIC PORTAL</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>Self-registration & instant OTP login</span>
              </div>

              {otpStep === "INPUT_PHONE" ? (
                <form onSubmit={handleSendOtp}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                      Registered Indian Mobile Number
                    </label>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
                      <div style={{ padding: "0 14px", background: "#e2e8f0", borderRight: "1px solid #cbd5e1", height: 42, display: "inline-flex", flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0, whiteSpace: "nowrap" }}>
                        {/* Crisp Indian Tricolor SVG */}
                        <svg width="20" height="14" viewBox="0 0 900 600" style={{ borderRadius: 2, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                          <rect width="900" height="200" fill="#FF9933" />
                          <rect y="200" width="900" height="200" fill="#FFFFFF" />
                          <rect y="400" width="900" height="200" fill="#138808" />
                          <circle cx="450" cy="300" r="75" fill="none" stroke="#000080" strokeWidth="12" />
                          <circle cx="450" cy="300" r="18" fill="#000080" />
                        </svg>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        style={{ border: "none", outline: "none", padding: "0 12px", width: "100%", height: 42, fontSize: 14, color: "#0f172a", background: "transparent", fontWeight: 600, letterSpacing: "0.05em" }}
                        autoFocus
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                      A 6-digit verification code will be sent via SMS / simulated SMS gateway.
                    </div>
                  </div>

                  {otpError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                      ⚠️ {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading || phone.length < 10}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      background: otpLoading || phone.length < 10 ? "#94a3b8" : "var(--brand-primary, #0284c7)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: otpLoading || phone.length < 10 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                    }}
                  >
                    {otpLoading ? <Lucide.Loader2 size={16} className="animate-spin" /> : <Lucide.Send size={16} />}
                    <span>{otpLoading ? "Sending OTP..." : "Get Verification Code (Send OTP)"}</span>
                  </button>
                </form>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>
                      Enter 6-digit OTP sent to <strong style={{ color: "#0f172a" }}>+91 {phone.slice(-4).padStart(10, "•")}</strong>
                    </div>
                    <button
                      onClick={() => setOtpStep("INPUT_PHONE")}
                      style={{ background: "transparent", border: "none", color: "#0284c7", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Change
                    </button>
                  </div>

                  {/* 6 Individual OTP Boxes */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: 44,
                          height: 48,
                          textAlign: "center",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          border: digit ? "2px solid #0284c7" : "1px solid #cbd5e1",
                          borderRadius: 8,
                          background: digit ? "rgba(2, 132, 199, 0.04)" : "#ffffff",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>

                  {/* Simulated Dev OTP Helper Badge */}
                  {simulatedOtp && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px dashed #86efac",
                        padding: "10px 14px",
                        borderRadius: 8,
                        marginBottom: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          ⚡ HACKATHON DEMO OTP (SIMULATED)
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: "#15803d", letterSpacing: "0.15em", fontFamily: "monospace" }}>
                          {simulatedOtp}
                        </div>
                      </div>
                      <button
                        onClick={handleAutoFillOtp}
                        style={{
                          background: "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        1-Click Auto Fill
                      </button>
                    </div>
                  )}

                  {otpError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                      ⚠️ {otpError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <button
                      onClick={() => handleVerifyOtp()}
                      disabled={otpLoading || otpDigits.join("").length < 6}
                      style={{
                        flex: 1,
                        padding: "11px 16px",
                        background: otpLoading || otpDigits.join("").length < 6 ? "#94a3b8" : "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: otpLoading || otpDigits.join("").length < 6 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {otpLoading ? <Lucide.Loader2 size={16} className="animate-spin" /> : <Lucide.CheckCircle2 size={16} />}
                      <span>Verify & Access Citizen Dashboard</span>
                    </button>
                  </div>

                  <div style={{ textAlign: "center", fontSize: 12, color: "#64748b" }}>
                    {resendCooldown > 0 ? (
                      <span>Resend OTP in <strong>{resendCooldown}s</strong></span>
                    ) : (
                      <button
                        onClick={() => handleSendOtp()}
                        style={{ background: "transparent", border: "none", color: "#0284c7", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Department Official Login (No Public Signup) */}
          {activePortal === "OFFICIAL" && (
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>GOVERNMENT OFFICIALS ONLY</span>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: 8, fontSize: 11, color: "#64748b", marginBottom: 18, lineHeight: 1.4 }}>
                🔒 Official accounts are provisioned exclusively by the State Nodal IT Administrator. Public citizen sign-up is strictly prohibited for departmental logins.
              </div>

              <form onSubmit={handleOfficialLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                    Official Employee ID / Gov Email
                  </label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, background: "#ffffff", padding: "0 12px" }}>
                    <Lucide.BadgeCheck size={16} style={{ color: "#64748b", marginRight: 8 }} />
                    <input
                      type="text"
                      value={officialId}
                      onChange={(e) => setOfficialId(e.target.value)}
                      placeholder="e.g. REV-001 or co.basopatti@bihar.gov.in"
                      style={{ border: "none", outline: "none", height: 40, width: "100%", fontSize: 13, color: "#0f172a" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                      Department Password / 2FA Pin
                    </label>
                    <span style={{ fontSize: 11, color: "#0284c7" }}>NIC e-Pramaan 2FA</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: 8, background: "#ffffff", padding: "0 12px" }}>
                    <Lucide.Lock size={16} style={{ color: "#64748b", marginRight: 8 }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ border: "none", outline: "none", height: 40, width: "100%", fontSize: 13, color: "#0f172a" }}
                    />
                  </div>
                </div>

                {officialError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                    ⚠️ {officialError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={officialLoading || !officialId}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    background: officialLoading || !officialId ? "#94a3b8" : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: officialLoading || !officialId ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                  }}
                >
                  {officialLoading ? <Lucide.Loader2 size={16} className="animate-spin" /> : <Lucide.Key size={16} />}
                  <span>{officialLoading ? "Authenticating Official..." : "Secure Department Login"}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ⚡ SIH 2026 Evaluation Personas Dock (For Hackathon Judges) */}
        <div style={{ marginTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                <span>⚡</span>
                <span>SIH 2026 Evaluation Personas (6 Core Roles)</span>
                <span style={{ fontSize: 10, background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  RBAC + ABAC + JURISDICTION
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Click any role to simulate immediate login with statutory departmental permissions and jurisdiction filters.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {DEMO_PERSONAS.slice(0, 6).map((persona) => {
              const isCurrentActive = currentUser.id === persona.id || currentUser.officialId === persona.officialId;

              return (
                <div
                  key={persona.id}
                  onClick={() => handleQuickPersonaSelect(persona)}
                  style={{
                    background: isCurrentActive ? "#f0f9ff" : "#ffffff",
                    border: isCurrentActive ? "2px solid #0284c7" : "1px solid #cbd5e1",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrentActive) {
                      e.currentTarget.style.borderColor = "#94a3b8";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrentActive) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.transform = "none";
                    }
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: isCurrentActive ? "#0284c7" : "#f1f5f9", color: isCurrentActive ? "#fff" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {React.createElement(getLucideIcon(persona.icon), { size: 15 })}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{persona.name}</div>
                          <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 700 }}>{persona.officialId} • {persona.title}</div>
                        </div>
                      </div>

                      <span style={{ fontSize: 9, background: persona.userType === "CITIZEN" ? "#e0f2fe" : "#f1f5f9", color: persona.userType === "CITIZEN" ? "#0369a1" : "#475569", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
                        {persona.role}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>
                      📍 <strong>Jurisdiction:</strong> {persona.jurisdiction}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.35 }}>
                      {persona.description}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{persona.department}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0284c7" }}>
                      {isCurrentActive ? "Active Session ✓" : "1-Click Switch →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
