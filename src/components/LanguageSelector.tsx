"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { Globe, Check, Search, X } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "compact" | "pill" | "sidebar" | "full";
  className?: string;
}

export function LanguageSelector({ variant = "compact", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages, currentLanguageMeta, isMounted } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      // Use click event with timeout to prevent immediate closure on toggle
      const timer = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 50);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.englishName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const activeMeta = isMounted ? currentLanguageMeta : supportedLanguages[0];

  return (
    <div
      className={`language-selector-wrapper ${className}`}
      style={{
        position: "relative",
        display: variant === "sidebar" ? "block" : "inline-block",
        width: variant === "sidebar" ? "100%" : "auto",
      }}
      ref={dropdownRef}
    >
      {/* 1. Compact Header Variant */}
      {variant === "compact" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 20,
            background: "var(--bg-input)",
            border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
            color: "var(--text-primary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Select Language / भाषा चुनें"
          aria-label="Select Language"
          aria-expanded={isOpen}
        >
          <Globe size={13} style={{ color: "var(--brand-primary)" }} />
          <span>{activeMeta.name}</span>
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", opacity: 0.8 }}>
            {activeMeta.code.toUpperCase()}
          </span>
        </button>
      )}

      {/* 2. Pill Variant (Mobile Header) */}
      {variant === "pill" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 9px",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 18,
            background: "var(--bg-input)",
            border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
            color: "var(--text-primary)",
            cursor: "pointer",
            maxWidth: 130,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          aria-label="Select Language"
        >
          <Globe size={12} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
          <span>{activeMeta.name}</span>
        </button>
      )}

      {/* 3. Sidebar Footer Variant */}
      {variant === "sidebar" && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-input)",
            border: `1px solid ${isOpen ? "var(--brand-primary)" : "var(--border-default)"}`,
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-primary)",
            transition: "all 0.15s ease",
            marginBottom: 8,
            textAlign: "left",
            fontFamily: "inherit",
          }}
          aria-label="Select Language"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={15} style={{ color: "var(--brand-primary)" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{activeMeta.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{activeMeta.englishName}</div>
            </div>
          </div>
          <span className="badge badge-neutral" style={{ fontSize: 10, padding: "2px 6px" }}>
            Change
          </span>
        </button>
      )}

      {/* Crisp Solid Popover Menu (NO BLUR, 100% CLEAR, VISIBLE & READABLE) */}
      {isOpen && (
        <div
          className="no-scrollbar"
          style={{
            position: "absolute",
            bottom: variant === "sidebar" ? "calc(100% + 6px)" : "auto",
            top: variant === "sidebar" ? "auto" : "calc(100% + 6px)",
            left: variant === "sidebar" ? 0 : "auto",
            right: 0,
            width: variant === "sidebar" ? "100%" : 260,
            maxWidth: "calc(100vw - 24px)",
            background: "#ffffff",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 14px 35px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header & Search */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border-default)",
              background: "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
              >
                <Globe size={14} style={{ color: "var(--brand-primary)" }} />
                <span>Select Language</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-tertiary)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={12}
                style={{
                  position: "absolute",
                  left: 8,
                  top: 8,
                  color: "var(--text-tertiary)",
                }}
              />
              <input
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px 5px 26px",
                  fontSize: 11,
                  background: "#ffffff",
                  border: "1px solid var(--border-default)",
                  borderRadius: 6,
                  color: "var(--text-primary)",
                  outline: "none",
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Clean Language Options List */}
          <div
            className="no-scrollbar"
            style={{
              maxHeight: 260,
              overflowY: "auto",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              background: "#ffffff",
            }}
          >
            {filteredLanguages.map((lang) => {
              const isSelected = language === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage(lang.code);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(15, 23, 42, 0.08)" : "transparent",
                    border: isSelected ? "1px solid var(--brand-primary)" : "1px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s ease",
                    fontFamily: "inherit",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? "var(--brand-primary)" : "var(--text-primary)",
                      }}
                    >
                      {lang.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {lang.englishName !== lang.name ? `(${lang.englishName})` : ""}
                    </span>
                  </div>

                  {isSelected && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "var(--brand-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <div
                style={{
                  padding: "16px 8px",
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 11,
                }}
              >
                No language found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
