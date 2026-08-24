"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth, DEMO_PERSONAS, getLucideIcon } from "@/lib/security/auth-context";
import { LanguageProvider, useLanguage } from "@/lib/i18n/language-context";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { getFilteredNavSections } from "@/lib/security/route-guard";
import { RouteGuard } from "@/components/RouteGuard";
import "./globals.css";

import { useState } from "react";
import { Menu, X, Home, Map as MapIcon, Search, Landmark, Layers, LogOut } from "lucide-react";

function getLocalizedNavLabel(label: string, t: (k: string) => string): string {
  const norm = (label || "").toLowerCase();
  if (norm.includes("dashboard") || norm.includes("home")) return t("nav.home");
  if (norm.includes("map") || norm.includes("gis") || norm.includes("cadastr")) return t("nav.map");
  if (norm.includes("search") || norm.includes("360")) return t("nav.search");
  if (norm.includes("application")) return t("nav.applications");
  if (norm.includes("service")) return t("nav.services");
  if (norm.includes("officer") || norm.includes("desk") || norm.includes("portal")) return t("nav.officer_desk");
  if (norm.includes("conflict") || norm.includes("dispute")) return t("nav.conflicts");
  if (norm.includes("ai") || norm.includes("intelligence") || norm.includes("satellite")) return t("nav.intelligence");
  if (norm.includes("security") || norm.includes("audit")) return t("nav.security");
  if (norm.includes("adapter")) return t("nav.adapters");
  if (norm.includes("import")) return "Data Import";
  if (norm.includes("admin")) return "Admin Overview";
  return label;
}

function getLocalizedSectionLabel(label: string, t: (k: string) => string): string {
  const norm = (label || "").toLowerCase();
  if (norm.includes("main") || norm.includes("core") || norm.includes("nav")) return t("section.core_navigation");
  if (norm.includes("citizen") || norm.includes("self-service") || norm.includes("workflow")) return t("section.citizen_services");
  if (norm.includes("officer") || norm.includes("govern") || norm.includes("statutory") || norm.includes("review") || norm.includes("department")) return t("section.officer_tools");
  if (norm.includes("intel") || norm.includes("standard") || norm.includes("system") || norm.includes("admin") || norm.includes("architecture")) return t("section.admin_governance");
  return label;
}

function Sidebar({ isOpen, onClose, isOverlay }: { isOpen: boolean; onClose: () => void; isOverlay?: boolean }) {
  const pathname = usePathname();
  const { currentUser, getInitials, isMounted, logout } = useAuth();
  const { t } = useLanguage();
  const activeUser = isMounted ? currentUser : null;
  const role = activeUser?.role || "CITIZEN";
  const navSections = getFilteredNavSections(role);

  return (
    <>
      {/* Mobile / Overlay Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOverlay ? "overlay-mode" : ""} ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="sidebar-logo-text" style={{ color: "var(--brand-primary)", fontWeight: 800 }}>SIH 2026</span>
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--text-tertiary)",
              display: (isOpen || isOverlay) ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="sidebar-section">
              <div className="sidebar-section-label">{getLocalizedSectionLabel(section.label, t)}</div>
              {section.items.map((item) => {
                const IconComponent = getLucideIcon(item.icon);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
                  >
                    <span className="sidebar-link-icon"><IconComponent size={18} /></span>
                    {getLocalizedNavLabel(item.label, t)}
                    {item.badge && (
                      <span className="sidebar-link-badge">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Pan-India Language Selector */}
          <LanguageSelector variant="sidebar" />

          {/* User Auth Card or Login CTA */}
          {activeUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                className="sidebar-user"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px",
                }}
              >
                <div className="sidebar-avatar" style={{ background: "var(--brand-primary)", color: "#fff", fontWeight: 700 }}>
                  {getInitials(activeUser.name)}
                </div>
                <div className="sidebar-user-info" style={{ overflow: "hidden" }}>
                  <div className="sidebar-user-name" style={{ fontWeight: 700 }}>
                    {activeUser.name}
                  </div>
                  <div className="sidebar-user-role" style={{ fontSize: 11, color: "var(--text-accent)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {activeUser.title?.split("/")[0].trim() || activeUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "var(--radius-md)",
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.15s ease",
                }}
              >
                <LogOut size={14} />
                <span>Logout Session</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "var(--brand-primary)",
                color: "#ffffff",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
              }}
            >
              <span>🔑 Login / Sign Up</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

function MobileHeader({ onToggleMenu, isOpen }: { onToggleMenu: () => void; isOpen: boolean }) {
  const { currentUser, isMounted, logout } = useAuth();
  const activeUser = isMounted ? currentUser : null;

  return (
    <header className="mobile-header">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onToggleMenu}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            borderRadius: 6,
          }}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 800, fontSize: 16, color: "var(--brand-primary)", letterSpacing: "-0.02em" }}>
          LandStack
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <LanguageSelector variant="pill" />
        {activeUser ? (
          <button
            onClick={() => logout()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        ) : (
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--brand-primary)", color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
              <span>Login</span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

function MobileBottomNav({ onToggleMenu }: { onToggleMenu: () => void }) {
  const pathname = usePathname();
  const { currentUser, isMounted } = useAuth();
  const { t } = useLanguage();
  const role = isMounted && currentUser ? currentUser.role : "CITIZEN";
  const servicesHref = role === "CITIZEN" ? "/services" : "/officer";
  const servicesLabel = role === "CITIZEN" ? t("nav.services") : t("nav.officer_desk");

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Home size={20} /></span>
        <span>{t("nav.home")}</span>
      </Link>

      <Link href="/map" className={`mobile-nav-item ${pathname === "/map" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><MapIcon size={20} /></span>
        <span>{t("nav.map").split(" ")[0]}</span>
      </Link>

      <Link href="/search" className={`mobile-nav-item ${pathname === "/search" ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Search size={20} /></span>
        <span>{t("nav.search").split(" ")[0]}</span>
      </Link>

      <Link href={servicesHref} className={`mobile-nav-item ${pathname.startsWith(servicesHref) ? "active" : ""}`}>
        <span className="mobile-nav-icon"><Landmark size={20} /></span>
        <span>{servicesLabel.split(" ")[0]}</span>
      </Link>

      <button
        onClick={onToggleMenu}
        className="mobile-nav-item"
        style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
      >
        <span className="mobile-nav-icon"><Layers size={20} /></span>
        <span>{t("nav.menu")}</span>
      </button>
    </nav>
  );
}

function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen, closeSidebar, toggleSidebar, isMapPage } = useSidebar();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <main style={{ width: "100vw", height: "100vh", overflow: "auto", background: "var(--bg-app)" }}>
        <RouteGuard>{children}</RouteGuard>
      </main>
    );
  }

  return (
    <div className={`app-shell ${isMapPage ? "map-mode" : ""}`}>
      {!isMapPage && (
        <MobileHeader onToggleMenu={toggleSidebar} isOpen={isOpen} />
      )}
      <Sidebar isOpen={isOpen} onClose={closeSidebar} isOverlay={isMapPage} />
      <main className={`app-main ${isMapPage ? "app-main-map" : ""}`}>
        <RouteGuard>{children}</RouteGuard>
      </main>
      {!isMapPage && (
        <MobileBottomNav onToggleMenu={toggleSidebar} />
      )}
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>LandStack — Integrated GIS Land Governance</title>
        <meta
          name="description"
          content="An Integrated GIS-based Digital Public Infrastructure for Land Governance. SIH 2026 | PS #26014"
        />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <SidebarProvider>
              <AppShellWrapper>{children}</AppShellWrapper>
            </SidebarProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
