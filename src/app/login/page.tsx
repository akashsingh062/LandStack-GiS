"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/security/auth-context";
import { DEPARTMENTS } from "@/lib/security/departments";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import * as Lucide from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "";
  const { loginWithOtp, signupCitizen, loginOfficial } = useAuth();
  const { t } = useLanguage();

  // Primary Portal Tab: "CITIZEN" | "OFFICIAL"
  const [activePortal, setActivePortal] = useState<"CITIZEN" | "OFFICIAL">(
    "CITIZEN",
  );

  // Citizen Sub-Tab: "LOGIN" | "SIGNUP"
  const [citizenMode, setCitizenMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");

  // Citizen States
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [stateCode, setStateCode] = useState("BR");
  const [district, setDistrict] = useState("Madhubani");
  const [circle, setCircle] = useState("Basopatti");
  const [village, setVillage] = useState("Mauza Arghawa (33)");

  // OTP Verification States
  const [otpStep, setOtpStep] = useState<"FORM" | "VERIFY_OTP">("FORM");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>("483921");
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // Official Staff States
  const [selectedDeptId, setSelectedDeptId] = useState("revenue");
  const [officialId, setOfficialId] = useState("REV-001");
  const [officialPassword, setOfficialPassword] = useState("");
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialError, setOfficialError] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // When Department dropdown changes, update default Official ID
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    if (dept) {
      setOfficialId(dept.defaultOfficerId);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Citizen Request OTP (Login or Signup)
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!phone || phone.trim().length < 10) {
      setAuthError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (citizenMode === "SIGNUP" && (!fullName || fullName.trim().length < 2)) {
      setAuthError("Please enter your Full Legal Name as per land records.");
      return;
    }

    setOtpLoading(true);

    try {
      if (citizenMode === "SIGNUP") {
        const res = await signupCitizen({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          state_code: stateCode,
          district_code: district,
          circle_code: circle,
          village_code: village,
        });

        if (!res.success) {
          setAuthError(res.error || "Failed to initiate registration.");
          setOtpLoading(false);
          return;
        }

        setSimulatedOtp(res.simulated_code || "483921");
      } else {
        const res = await fetch("/api/v1/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();

        if (!res.ok) {
          setAuthError(data.error || "Failed to dispatch OTP.");
          setOtpLoading(false);
          return;
        }

        setSimulatedOtp(data.simulated_code || "483921");
      }

      setResendCooldown(30);
      setOtpStep("VERIFY_OTP");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpLoading(false);
    } catch {
      setAuthError("Network error. Please check your connection.");
      setOtpLoading(false);
    }
  };

  // Handle individual OTP box typing or multi-character paste
  const handleOtpDigitChange = (index: number, value: string) => {
    const rawVal = value.replace(/\D/g, "");
    if (!rawVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    // If multiple digits were pasted/entered into this box
    if (rawVal.length > 1) {
      const digits = rawVal.slice(0, 6).split("");
      const newDigits = [...otpDigits];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newDigits[index + i] = digit;
        }
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      if (newDigits.every((d) => d !== "") && newDigits.join("").length === 6) {
        handleVerifyOtp(newDigits.join(""));
      }
      return;
    }

    const val = rawVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Dedicated clipboard paste handler for OTP inputs
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split("");
    const newDigits = ["", "", "", "", "", ""];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newDigits[i] = digit;
      }
    });
    setOtpDigits(newDigits);

    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();

    if (digits.length === 6) {
      handleVerifyOtp(digits.join(""));
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Copy simulated OTP to clipboard
  const handleCopyOtp = () => {
    if (!simulatedOtp) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(simulatedOtp);
    }
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // 1-Click Auto Fill simulated OTP
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
      setAuthError("Please enter the complete 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    setAuthError(null);

    const res = await loginWithOtp(phone, code, {
      fullName: fullName || undefined,
      email: email || undefined,
      district_code: district,
      circle_code: circle,
      village_code: village,
    });

    if (!res.success) {
      setAuthError(res.error || "Incorrect OTP. Please try again.");
      setOtpLoading(false);
      return;
    }

    const targetUrl =
      redirectParam && redirectParam.startsWith("/") ? redirectParam : "/";
    setAuthFeedback(`✓ Identity Verified. Logging into LandStack...`);
    setTimeout(() => {
      router.push(targetUrl);
    }, 400);
  };

  // Official Staff Login Submit
  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialId) {
      setOfficialError("Official Employee ID or Government Email is required.");
      return;
    }

    setOfficialLoading(true);
    setOfficialError(null);

    const res = await loginOfficial(
      officialId,
      officialPassword,
      selectedDeptId,
    );
    if (!res.success) {
      setOfficialError(
        res.error || "Authentication failed. Please verify credentials.",
      );
      setOfficialLoading(false);
      return;
    }

    const targetUrl =
      redirectParam && redirectParam.startsWith("/") && redirectParam !== "/"
        ? redirectParam
        : res.redirect_url || "/officer";

    setAuthFeedback("✓ Welcome Officer. Accessing Departmental Portal...");
    setTimeout(() => {
      router.push(targetUrl);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-app, #f8fafc)",
        color: "var(--text-primary, #0f172a)",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      {/* Top Header Bar */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",
            transition: "opacity 0.15s ease",
          }}
          className="hover:opacity-80"
          title="Return to LandStack Home Dashboard"
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--brand-primary, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
              flexShrink: 0,
            }}
          >
            <Lucide.Building2 size={22} />
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "#0f172a",
              }}
            >
              LANDSTACK
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Digital Public Infrastructure for Land Governance • SIH 2026
            </div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LanguageSelector variant="compact" />
        </div>
      </header>

      <main
        style={{ maxWidth: 720, margin: "0 auto", padding: "36px 16px 64px" }}
      >
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(2, 132, 199, 0.08)",
              border: "1px solid rgba(2, 132, 199, 0.2)",
              padding: "4px 12px",
              borderRadius: 20,
              color: "#0284c7",
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            <Lucide.ShieldCheck size={14} /> National Land Record Authentication
            & RBAC Engine
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            Land Governance Access Portal
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            Citizen self-service onboarding and authorized departmental staff
            authentication.
          </p>

          {authFeedback && (
            <div
              style={{
                marginTop: 14,
                background: "#ecfdf5",
                border: "1px solid #6ee7b7",
                color: "#065f46",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              {authFeedback}
            </div>
          )}
        </div>

        {/* Dual Portal Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
          }}
        >
          {/* Main Tabs: Citizen vs Official */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <button
              onClick={() => {
                setActivePortal("CITIZEN");
                setAuthError(null);
                setOfficialError(null);
              }}
              style={{
                padding: "14px 16px",
                border: "none",
                background:
                  activePortal === "CITIZEN" ? "#ffffff" : "transparent",
                color: activePortal === "CITIZEN" ? "#0284c7" : "#64748b",
                fontWeight: activePortal === "CITIZEN" ? 800 : 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom:
                  activePortal === "CITIZEN" ? "2px solid #0284c7" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Lucide.User size={17} />
              <span>1. Citizen Portal</span>
            </button>

            <button
              onClick={() => {
                setActivePortal("OFFICIAL");
                setAuthError(null);
                setOfficialError(null);
              }}
              style={{
                padding: "14px 16px",
                border: "none",
                background:
                  activePortal === "OFFICIAL" ? "#ffffff" : "transparent",
                color: activePortal === "OFFICIAL" ? "#0284c7" : "#64748b",
                fontWeight: activePortal === "OFFICIAL" ? 800 : 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom:
                  activePortal === "OFFICIAL" ? "2px solid #0284c7" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Lucide.Landmark size={17} />
              <span>2. Department Official</span>
            </button>
          </div>

          {/* Tab 1: Citizen Portal */}
          {activePortal === "CITIZEN" && (
            <div style={{ padding: "24px 28px" }}>
              {/* Sub-Switch: Login vs Sign Up */}
              <div
                style={{
                  display: "flex",
                  background: "#f1f5f9",
                  padding: 4,
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode("LOGIN");
                    setOtpStep("FORM");
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: 6,
                    background:
                      citizenMode === "LOGIN" ? "#ffffff" : "transparent",
                    color: citizenMode === "LOGIN" ? "#0f172a" : "#64748b",
                    fontWeight: citizenMode === "LOGIN" ? 800 : 600,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow:
                      citizenMode === "LOGIN"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  Citizen Login (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode("SIGNUP");
                    setOtpStep("FORM");
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: 6,
                    background:
                      citizenMode === "SIGNUP" ? "#ffffff" : "transparent",
                    color: citizenMode === "SIGNUP" ? "#0f172a" : "#64748b",
                    fontWeight: citizenMode === "SIGNUP" ? 800 : 600,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow:
                      citizenMode === "SIGNUP"
                        ? "0 1px 3px rgba(0,0,0,0.1)"
                        : "none",
                  }}
                >
                  ✨ New Citizen Sign Up
                </button>
              </div>

              {otpStep === "FORM" ? (
                <form onSubmit={handleCitizenSubmit}>
                  {citizenMode === "SIGNUP" && (
                    <>
                      <div style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#334155",
                            marginBottom: 6,
                          }}
                        >
                          Full Legal Name{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            color: "#0f172a",
                            outline: "none",
                            background: "#f8fafc",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#334155",
                            marginBottom: 6,
                          }}
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ramesh.kumar@example.com"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            color: "#0f172a",
                            outline: "none",
                            background: "#f8fafc",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#334155",
                              marginBottom: 6,
                            }}
                          >
                            District
                          </label>
                          <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="Madhubani"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              fontSize: 13,
                              color: "#0f172a",
                              outline: "none",
                              background: "#f8fafc",
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#334155",
                              marginBottom: 6,
                            }}
                          >
                            Circle / Anchal
                          </label>
                          <input
                            type="text"
                            value={circle}
                            onChange={(e) => setCircle(e.target.value)}
                            placeholder="Basopatti"
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "1px solid #cbd5e1",
                              fontSize: 13,
                              color: "#0f172a",
                              outline: "none",
                              background: "#f8fafc",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#334155",
                            marginBottom: 6,
                          }}
                        >
                          Mauza / Village (Optional)
                        </label>
                        <input
                          type="text"
                          value={village}
                          onChange={(e) => setVillage(e.target.value)}
                          placeholder="Mauza Arghawa (33)"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                            color: "#0f172a",
                            outline: "none",
                            background: "#f8fafc",
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* Registered Mobile Number Input with strict 1-line SVG flag & +91 */}
                  <div style={{ marginBottom: 18 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 6,
                      }}
                    >
                      {citizenMode === "SIGNUP"
                        ? "Mobile Number for OTP Verification"
                        : "Registered Indian Mobile Number"}{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          padding: "0 14px",
                          background: "#e2e8f0",
                          borderRight: "1px solid #cbd5e1",
                          height: 42,
                          display: "inline-flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {/* Crisp Indian Tricolor SVG */}
                        <svg
                          width="20"
                          height="14"
                          viewBox="0 0 900 600"
                          style={{
                            borderRadius: 2,
                            flexShrink: 0,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }}
                        >
                          <rect width="900" height="200" fill="#FF9933" />
                          <rect
                            y="200"
                            width="900"
                            height="200"
                            fill="#FFFFFF"
                          />
                          <rect
                            y="400"
                            width="900"
                            height="200"
                            fill="#138808"
                          />
                          <circle
                            cx="450"
                            cy="300"
                            r="75"
                            fill="none"
                            stroke="#000080"
                            strokeWidth="12"
                          />
                          <circle cx="450" cy="300" r="18" fill="#000080" />
                        </svg>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#334155",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.02em",
                          }}
                        >
                          +91
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder=" "
                        style={{
                          border: "none",
                          outline: "none",
                          padding: "0 12px",
                          width: "100%",
                          height: 42,
                          fontSize: 14,
                          color: "#0f172a",
                          background: "transparent",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                        }}
                        autoFocus
                      />
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}
                    >
                      A 6-digit OTP verification code will be sent via SMS /
                      simulated SMS gateway.
                    </div>
                  </div>

                  {authError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        marginBottom: 14,
                      }}
                    >
                      ⚠️ {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading || phone.length < 10}
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      background:
                        otpLoading || phone.length < 10
                          ? "#94a3b8"
                          : "var(--brand-primary, #0284c7)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor:
                        otpLoading || phone.length < 10
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                    }}
                  >
                    {otpLoading ? (
                      <Lucide.Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Lucide.Send size={16} />
                    )}
                    <span>
                      {otpLoading
                        ? "Processing..."
                        : citizenMode === "SIGNUP"
                          ? "Register & Send OTP"
                          : "Get Verification Code (Send OTP)"}
                    </span>
                  </button>
                </form>
              ) : (
                /* OTP Verification View */
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#334155",
                        fontWeight: 600,
                      }}
                    >
                      Enter 6-digit OTP sent to{" "}
                      <strong style={{ color: "#0f172a" }}>
                        +91 {phone.slice(-4).padStart(10, "•")}
                      </strong>
                    </div>
                    <button
                      onClick={() => setOtpStep("FORM")}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#0284c7",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Change Mobile
                    </button>
                  </div>

                  {/* 6 Individual OTP Boxes */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={digit}
                        onChange={(e) =>
                          handleOtpDigitChange(idx, e.target.value)
                        }
                        onPaste={handleOtpPaste}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: 44,
                          height: 48,
                          textAlign: "center",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          border: digit
                            ? "2px solid #0284c7"
                            : "1px solid #cbd5e1",
                          borderRadius: 8,
                          background: digit
                            ? "rgba(2, 132, 199, 0.04)"
                            : "#ffffff",
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
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#166534",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          ⚡ SIMULATED SMS OTP
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: "#15803d",
                            letterSpacing: "0.15em",
                            fontFamily: "monospace",
                          }}
                        >
                          {simulatedOtp}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyOtp}
                        style={{
                          background: copiedOtp ? "#047857" : "#16a34a",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {copiedOtp ? (
                          <>
                            <Lucide.Check size={13} />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Lucide.Copy size={13} />
                            <span>Copy OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {authError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#b91c1c",
                        padding: "8px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        marginBottom: 14,
                      }}
                    >
                      ⚠️ {authError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <button
                      onClick={() => handleVerifyOtp()}
                      disabled={otpLoading || otpDigits.join("").length < 6}
                      style={{
                        flex: 1,
                        padding: "11px 16px",
                        background:
                          otpLoading || otpDigits.join("").length < 6
                            ? "#94a3b8"
                            : "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor:
                          otpLoading || otpDigits.join("").length < 6
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {otpLoading ? (
                        <Lucide.Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Lucide.CheckCircle2 size={16} />
                      )}
                      <span>
                        {citizenMode === "SIGNUP"
                          ? "Complete Registration & Login"
                          : "Verify & Access Dashboard"}
                      </span>
                    </button>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    {resendCooldown > 0 ? (
                      <span>
                        Resend OTP in <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleCitizenSubmit(e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#0284c7",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Department Official Portal */}
          {activePortal === "OFFICIAL" && (
            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    background: "#fef3c7",
                    color: "#b45309",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontWeight: 800,
                  }}
                >
                  GOVERNMENT OFFICIALS ONLY
                </span>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "10px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#64748b",
                  marginBottom: 18,
                  lineHeight: 1.4,
                }}
              >
                🔒 Official accounts are pre-provisioned in the State Land
                Registry database. Please select your Department and enter your
                Official Employee ID.
              </div>

              <form onSubmit={handleOfficialLogin}>
                {/* Department Dropdown */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 6,
                    }}
                  >
                    Select Government Department{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      color: "#0f172a",
                      background: "#ffffff",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code}) — {dept.defaultOfficerName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Official ID Input */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: 6,
                    }}
                  >
                    Official Employee ID / Gov Email{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      background: "#ffffff",
                      padding: "0 12px",
                    }}
                  >
                    <Lucide.BadgeCheck
                      size={16}
                      style={{ color: "#64748b", marginRight: 8 }}
                    />
                    <input
                      type="text"
                      required
                      value={officialId}
                      onChange={(e) => setOfficialId(e.target.value)}
                      placeholder="e.g. REV-001 or co.basopatti@bihar.gov.in"
                      style={{
                        border: "none",
                        outline: "none",
                        height: 40,
                        width: "100%",
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    />
                  </div>
                </div>

                {/* Password Input with Common Password Prompt */}
                <div style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      Department Password{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      background: "#ffffff",
                      padding: "0 12px",
                    }}
                  >
                    <Lucide.Lock
                      size={16}
                      style={{ color: "#64748b", marginRight: 8 }}
                    />
                    <input
                      type="password"
                      required
                      value={officialPassword}
                      onChange={(e) => setOfficialPassword(e.target.value)}
                      placeholder=""
                      style={{
                        border: "none",
                        outline: "none",
                        height: 40,
                        width: "100%",
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    />
                  </div>
                </div>

                {officialError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fca5a5",
                      color: "#b91c1c",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      marginBottom: 14,
                    }}
                  >
                    ⚠️ {officialError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={officialLoading || !officialId}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    background:
                      officialLoading || !officialId ? "#94a3b8" : "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      officialLoading || !officialId
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                  }}
                >
                  {officialLoading ? (
                    <Lucide.Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lucide.Key size={16} />
                  )}
                  <span>
                    {officialLoading
                      ? "Authenticating Official..."
                      : "Secure Department Login"}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div style={{ minHeight: "100vh", background: "#f8fafc" }} />}
    >
      <LoginPageContent />
    </Suspense>
  );
}
