"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/security/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import apiClient from "@/lib/api-client";
import * as Lucide from "lucide-react";

const getPersonaIcon = (iconName: string) => {
  switch (iconName) {
    case "User": return Lucide.User;
    case "Briefcase": return Lucide.Briefcase;
    case "FileSignature": return Lucide.FileSignature;
    case "Ruler": return Lucide.Ruler;
    case "Landmark": return Lucide.Landmark;
    case "Shield": return Lucide.Shield;
    default: return Lucide.User;
  }
};

interface StatsData {
  overview: {
    total_parcels: number;
    total_identifiers: number;
    total_owners: number;
    total_ror_records: number;
  };
  governance: {
    registrations: number;
    encumbrances: number;
    building_permissions: number;
    disputes: number;
    property_tax: number;
  };
  spatial: {
    land_use_zones: number;
    master_plan_zones: number;
    restriction_zones: number;
  };
  data_sources: {
    total: number;
    departments: string[];
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [citizenApps, setCitizenApps] = useState<any[]>([]);

  useEffect(() => {
    apiClient
      .get("/api/stats")
      .then((res) => setStats(res.data))
      .catch(console.error);

    apiClient
      .get("/api/v1/applications")
      .then((res) => {
        if (res.data?.applications) setCitizenApps(res.data.applications);
      })
      .catch(console.error);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router]
  );

  const role = currentUser.role;

  return (
    <motion.div
      className="app-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Role-Aware Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-md) var(--space-lg)",
          marginBottom: "var(--space-lg)",
          boxShadow: "var(--shadow-sm)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              background: "var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.25)",
              flexShrink: 0,
            }}
          >
            {React.createElement(getPersonaIcon(currentUser.icon), { size: 24, color: "#ffffff" })}
          </motion.div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Welcome, {currentUser.name}
              </h1>
              <span className="badge badge-info" style={{ fontSize: 11 }}>
                {currentUser.role}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-accent)", marginTop: 2, margin: 0 }}>
              {currentUser.title} • {currentUser.jurisdiction}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: "100%", maxWidth: 360 }}>
          <Link href="/login" className="btn btn-secondary" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, flex: "1 1 120px", justifyContent: "center" }}>
            <Lucide.Repeat size={14} /> {t("nav.switch_role")}
          </Link>
          {role === "CITIZEN" ? (
            <Link href="/services" className="btn btn-primary" style={{ fontSize: 12, flex: "1 1 120px", justifyContent: "center" }}>
              <Lucide.Plus size={14} /> {t("action.apply")}
            </Link>
          ) : role === "ADMIN" || role === "AUDITOR" ? (
            <Link href="/admin/security" className="btn btn-primary" style={{ fontSize: 12, flex: "1 1 120px", justifyContent: "center" }}>
              <Lucide.Shield size={14} /> {t("nav.security")}
            </Link>
          ) : (
            <Link href="/officer" className="btn btn-primary" style={{ fontSize: 12, flex: "1 1 120px", justifyContent: "center" }}>
              <Lucide.Briefcase size={14} /> {t("nav.officer_desk")}
            </Link>
          )}
        </div>
      </motion.div>

      {/* Hero Universal Search */}
      <motion.div
        className="hero"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{ padding: "var(--space-md) var(--space-lg)", marginBottom: "var(--space-lg)" }}
      >
        <h2 className="hero-title" style={{ fontSize: 22, marginBottom: 4 }}>{t("hero.title")}</h2>
        <p className="hero-subtitle" style={{ fontSize: 13, maxWidth: 650, margin: "0 auto 16px" }}>
          {t("hero.subtitle")}
        </p>
        <form className="hero-search" onSubmit={handleSearch} style={{ maxWidth: 640 }}>
          <span className="hero-search-icon"><Lucide.Search size={18} /></span>
          <input
            className="input"
            placeholder={t("hero.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 48, fontSize: 13 }}
          />
        </form>
      </motion.div>

      {/* ROLE SPECIFIC STATS GRID */}
      {role === "CITIZEN" && (
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
            { icon: <Lucide.MapPin size={20} />, value: "3", label: t("stat.recorded_parcels"), bg: "var(--status-info-bg)", desc: "Khesra #1420, #1894, #1648" },
            { icon: <Lucide.Ruler size={20} />, value: "12.4 Ac", label: t("stat.total_landholding"), bg: "var(--status-success-bg)", desc: "Mauza Arghawa (33)" },
            { icon: <Lucide.ClipboardList size={20} />, value: citizenApps.length || "2", label: t("stat.active_applications"), bg: "var(--status-warning-bg)", desc: "1 Approved, 1 In Review" },
            { icon: <Lucide.Wallet size={20} />, value: "₹ 45.00", label: t("stat.annual_lagan"), bg: "rgba(139,92,246,0.12)", desc: "Jamabandi #45 (Paid)" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {role === "REVENUE_OFFICER" && (
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
            { icon: <Lucide.MapPin size={20} />, value: stats?.overview.total_parcels || 300, label: "Jurisdiction Parcels", bg: "var(--status-info-bg)", desc: "Basopatti Circle" },
            { icon: <Lucide.ClipboardList size={20} />, value: "4", label: "Pending Mutation Queue", bg: "var(--status-warning-bg)", desc: "SLA: 21 Days Target" },
            { icon: <Lucide.AlertTriangle size={20} />, value: "3", label: "Active Boundary Conflicts", bg: "var(--status-error-bg)", desc: "Overlaps on #1420, #1648, #1881" },
            { icon: <Lucide.FileText size={20} />, value: stats?.overview.total_ror_records || 300, label: "Jamabandi RoR Records", bg: "var(--status-success-bg)", desc: "Bihar Digital Khatiyan" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {role === "REGISTRATION_OFFICER" && (
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
            { icon: <Lucide.FileSignature size={20} />, value: stats?.governance.registrations || 7, label: "Registered Deeds", bg: "var(--status-info-bg)", desc: "Madhubani District DSR" },
            { icon: <Lucide.Lock size={20} />, value: stats?.governance.encumbrances || 3, label: "Encumbrance Requests", bg: "var(--status-warning-bg)", desc: "Bank & Citizen NOCs" },
            { icon: <Lucide.Building size={20} />, value: "2", label: "Active Bank Mortgages", bg: "rgba(139,92,246,0.12)", desc: "SBI & PNB Charges Registered" },
            { icon: <Lucide.Banknote size={20} />, value: "₹ 4.85 L", label: "Stamp Duty Realized", bg: "var(--status-success-bg)", desc: "Current Fiscal Quarter" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {role === "PLANNING_OFFICER" && (
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
            { icon: <Lucide.Ruler size={20} />, value: stats?.spatial.master_plan_zones || 12, label: "Master Plan 2035 Zones", bg: "var(--status-info-bg)", desc: "Madhubani Planning Area" },
            { icon: <Lucide.Building2 size={20} />, value: stats?.governance.building_permissions || 3, label: "Building Permissions", bg: "var(--status-warning-bg)", desc: "Residential & Commercial" },
            { icon: <Lucide.Trees size={20} />, value: stats?.spatial.restriction_zones || 2, label: "Buffer Restriction Zones", bg: "rgba(236,72,153,0.12)", desc: "Kamla Nadi & Forest Setbacks" },
            { icon: <Lucide.CheckCircle size={20} />, value: "100%", label: "FAR Compliance Rate", bg: "var(--status-success-bg)", desc: "Automated Geospatial Rules" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {role === "TAX_OFFICER" && (
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
            { icon: <Lucide.Landmark size={20} />, value: stats?.governance.property_tax || 300, label: "Assessed Properties", bg: "var(--status-info-bg)", desc: "Nagar Panchayat Basopatti" },
            { icon: <Lucide.Wallet size={20} />, value: "₹ 18.4 L", label: "Annual Tax Demand", bg: "var(--status-warning-bg)", desc: "GIS-Linked Assessment" },
            { icon: <Lucide.CheckCircle size={20} />, value: "₹ 14.2 L", label: "Total Tax Collected", bg: "var(--status-success-bg)", desc: "77.2% Collection Efficiency" },
            { icon: <Lucide.AlertCircle size={20} />, value: "12", label: "Defaulter Notices Pending", bg: "var(--status-error-bg)", desc: "Arrears > ₹10,000" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {(role === "ADMIN" || role === "AUDITOR") && (
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
            { icon: <Lucide.Shield size={20} />, value: "7", label: "SHA-256 Audit Logs", bg: "var(--status-info-bg)", desc: "Tamper-Evident Chain" },
            { icon: <Lucide.Ban size={20} />, value: "2", label: "Unauthorized Denials", bg: "var(--status-error-bg)", desc: "Cross-State ABAC Blocks" },
            { icon: <Lucide.Handshake size={20} />, value: "3", label: "DPDPA 2023 Consents", bg: "var(--status-success-bg)", desc: "Active Purpose Registries" },
            { icon: <Lucide.Plug size={20} />, value: "4", label: "State Adapters Live", bg: "rgba(139,92,246,0.12)", desc: "Bihar, UP, MH, KA" },
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
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ROLE SPECIFIC QUICK ACTIONS HUB */}
      <motion.h3
        className="section-title"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "var(--space-md)", fontSize: 16 }}
      >
        {role === "CITIZEN" ? t("section.citizen_services") : role === "ADMIN" || role === "AUDITOR" ? "System Governance & Security Hub" : "Department Operational Actions"}
      </motion.h3>

      <motion.div
        className="service-grid"
        style={{ marginBottom: "var(--space-lg)" }}
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {role === "CITIZEN" && [
          { icon: <Lucide.Map size={24} color="var(--brand-primary)" />, name: t("service.my_parcels"), desc: t("service.my_parcels_desc"), href: "/map" },
          { icon: <Lucide.FileText size={24} color="var(--brand-primary)" />, name: t("service.ror_extract"), desc: t("service.ror_extract_desc"), href: "/services/ror-extract" },
          { icon: <Lucide.FileSignature size={24} color="var(--brand-primary)" />, name: t("service.apply_mutation"), desc: t("service.apply_mutation_desc"), href: "/services/mutation" },
          { icon: <Lucide.ClipboardList size={24} color="var(--brand-primary)" />, name: t("service.track_apps"), desc: t("service.track_apps_desc"), href: "/applications" },
          { icon: <Lucide.Lock size={24} color="var(--brand-primary)" />, name: t("service.encumbrance"), desc: t("service.encumbrance_desc"), href: "/services/encumbrance-certificate" },
          { icon: <Lucide.Building2 size={24} color="var(--brand-primary)" />, name: t("service.building_permission"), desc: t("service.building_permission_desc"), href: "/services/building-permission" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}

        {role === "REVENUE_OFFICER" && [
          { icon: <Lucide.Briefcase size={24} color="var(--brand-primary)" />, name: "Mutation Approval Desk", desc: "Inspect Jamabandi & approve title transfer", href: "/officer" },
          { icon: <Lucide.AlertTriangle size={24} color="var(--status-warning)" />, name: "Boundary Dispute Resolver", desc: "Resolve 3 active spatial parcel overlaps", href: "/officer/conflicts" },
          { icon: <Lucide.Map size={24} color="var(--brand-primary)" />, name: "Cadastral Survey Map", desc: "Inspect 300 organic agricultural parcels", href: "/map" },
          { icon: <Lucide.FileText size={24} color="var(--brand-primary)" />, name: "Jamabandi RoR Audit", desc: "Verify revenue khata & lagan records", href: "/services/ror-extract" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}

        {role === "REGISTRATION_OFFICER" && [
          { icon: <Lucide.FileSignature size={24} color="var(--brand-primary)" />, name: "Registration Queue", desc: "Verify registered sale deeds & stamps", href: "/officer?dept=Registration" },
          { icon: <Lucide.ShieldCheck size={24} color="var(--brand-primary)" />, name: "Issue Non-Encumbrance", desc: "Generate certified search certificate", href: "/services/encumbrance-certificate" },
          { icon: <Lucide.Landmark size={24} color="var(--brand-primary)" />, name: "Bank Mortgage Registry", desc: "Review bank collateral charge filings", href: "/officer" },
          { icon: <Lucide.Map size={24} color="var(--brand-primary)" />, name: "Cadastral Verification", desc: "Cross-check deed geometry on GIS", href: "/map" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}

        {role === "PLANNING_OFFICER" && [
          { icon: <Lucide.Building2 size={24} color="var(--brand-primary)" />, name: "Building Plan Desk", desc: "Sanction residential & commercial plans", href: "/officer?dept=Planning" },
          { icon: <Lucide.Compass size={24} color="var(--brand-primary)" />, name: "Master Plan 2035 GIS", desc: "Evaluate zoning and land-use compliance", href: "/map" },
          { icon: <Lucide.Trees size={24} color="var(--brand-primary)" />, name: "Environmental Buffer Audit", desc: "Verify river & canal setback zones", href: "/map" },
          { icon: <Lucide.Sparkles size={24} color="var(--brand-primary)" />, name: "AI Geospatial Change", desc: "Satellite change detection radar", href: "/admin/intelligence" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}

        {role === "TAX_OFFICER" && [
          { icon: <Lucide.ReceiptText size={24} color="var(--brand-primary)" />, name: "Municipal Tax Desk", desc: "Review property tax assessments", href: "/officer?dept=Taxation" },
          { icon: <Lucide.Wallet size={24} color="var(--brand-primary)" />, name: "Issue Demand Notices", desc: "Generate payment challans & receipts", href: "/services/property-tax" },
          { icon: <Lucide.Map size={24} color="var(--brand-primary)" />, name: "GIS Property Mapping", desc: "Audit built-up footprint vs tax slab", href: "/map" },
          { icon: <Lucide.AlertCircle size={24} color="var(--status-warning)" />, name: "Arrears & Defaulters", desc: "Track high-value municipal arrears", href: "/officer" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}

        {(role === "ADMIN" || role === "AUDITOR") && [
          { icon: <Lucide.Shield size={24} color="var(--brand-primary)" />, name: "Audit Trail Ledger", desc: "Verify SHA-256 cryptographic chain integrity", href: "/admin/security" },
          { icon: <Lucide.Plug size={24} color="var(--brand-primary)" />, name: "Interoperability Adapters", desc: "Manage state land registry connectors", href: "/admin/adapters" },
          { icon: <Lucide.Handshake size={24} color="var(--brand-primary)" />, name: "DPDPA Consents", desc: "Purpose-bound citizen access logs", href: "/admin/security" },
          { icon: <Lucide.Ban size={24} color="var(--status-error)" />, name: "ABAC Policy Engine", desc: "Zero Trust role and jurisdiction enforcement", href: "/admin/security" },
        ].map((s) => (
          <motion.div
            key={s.name}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.18 } }}
          >
            <Link href={s.href} className="service-card" style={{ height: "100%", textDecoration: "none" }}>
              <div className="service-icon">{s.icon}</div>
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Two Column Layout: Recent Applications & Data Sources */}
      <motion.div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--space-md)",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        {/* Left Column: Recent Applications or Quick Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {role === "CITIZEN" ? t("service.track_apps") : "Pending Jurisdiction Workflows"}
            </h3>
            <Link href={role === "CITIZEN" ? "/applications" : "/officer"} style={{ fontSize: 12, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 600 }}>
              View All →
            </Link>
          </div>

          {citizenApps.length === 0 ? (
            <div style={{ padding: "var(--space-md)", textAlign: "center", color: "var(--text-tertiary)" }}>
              No active applications found.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {citizenApps.slice(0, 3).map((a) => (
                <motion.div
                  key={a.application_no}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>{a.application_no}</div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", marginTop: 2 }}>{a.service_type}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Parcel: {a.parcel_ulpin || "IN-BR-10-00000001-62"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${a.status === "APPROVED" ? "badge-success" : a.status === "UNDER_REVIEW" ? "badge-warning" : "badge-info"}`}>
                      {a.status}
                    </span>
                    <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>● SLA on Track</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Multi-Department Interoperability Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Interoperability Bridge</h3>
            <span className="badge badge-success">API Live</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { dept: "Revenue (Jamabandi RoR)", count: stats?.overview.total_ror_records || 300, status: "Connected", code: "BR-REV" },
              { dept: "Registration & Stamps", count: stats?.governance.registrations || 7, status: "Connected", code: "BR-DSR" },
              { dept: "Town Planning (Master Plan 2035)", count: stats?.spatial.master_plan_zones || 12, status: "Connected", code: "BR-TPO" },
              { dept: "Municipal Taxation", count: stats?.governance.property_tax || 300, status: "Connected", code: "BR-NP" },
              { dept: "C&AG / Security Audit", count: 7, status: "Active Chain", code: "AUDIT-256" },
            ].map((d) => (
              <motion.div
                key={d.dept}
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{d.dept}</div>
                  <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--text-tertiary)" }}>{d.code}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>{d.count} records</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
