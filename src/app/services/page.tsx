"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Lucide from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { useAuth } from "@/lib/security/auth-context";

const SERVICES = [
  {
    id: "ownership-verification",
    icon: <Lucide.CheckCircle2 size={24} />,
    name: "Ownership Verification",
    desc: "Verify ownership records across Revenue and Registration departments",
    dept: "Revenue + Registration",
    time: "2-3 business days",
  },
  {
    id: "ror-extract",
    icon: <Lucide.FileText size={24} />,
    name: "RoR Extract",
    desc: "Request a certified copy of Record of Rights (Khatiyan / Jamabandi)",
    dept: "Revenue Department",
    time: "3-5 business days",
  },
  {
    id: "encumbrance-certificate",
    icon: <Lucide.Lock size={24} />,
    name: "Encumbrance Certificate",
    desc: "Check non-encumbrance status, bank mortgages and registered deeds",
    dept: "Registration Department",
    time: "2-3 business days",
  },
  {
    id: "building-permission",
    icon: <Lucide.Hammer size={24} />,
    name: "Building Permission",
    desc: "Apply for building plan clearance or layout NOC from Town Planning",
    dept: "Planning Department",
    time: "15-30 business days",
  },
  {
    id: "land-use-certificate",
    icon: <Lucide.Trees size={24} />,
    name: "Land Use Certificate",
    desc: "Get certified Master Plan 2035 land use and zoning compliance certificate",
    dept: "Planning Department",
    time: "5-7 business days",
  },
  {
    id: "property-tax",
    icon: <Lucide.Wallet size={24} />,
    name: "Property Tax Query",
    desc: "View municipal property tax assessment, tax demand, and payment receipts",
    dept: "Municipality Department",
    time: "Instant",
  },
  {
    id: "mutation",
    icon: <Lucide.FileSignature size={24} />,
    name: "Property Mutation",
    desc: "Apply for mutation / title name transfer in Jamabandi revenue records",
    dept: "Revenue Department",
    time: "15-45 business days",
  },
  {
    id: "restriction-check",
    icon: <Lucide.AlertTriangle size={24} />,
    name: "Restriction Check",
    desc: "Check if parcel falls in government acquisition, wetland, or protected zone",
    dept: "Revenue Department",
    time: "Instant",
  },
];

export default function ServicesPage() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const router = useRouter();

  const handleServiceClick = (e: React.MouseEvent, serviceId: string) => {
    if (!currentUser) {
      e.preventDefault();
      router.push(`/login?redirect=/services/${serviceId}`);
    }
  };

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
          <h1 className="page-title">🏛️ {t("services.title")}</h1>
          <p className="page-subtitle">{t("services.subtitle")}</p>
        </div>
      </motion.div>

      {/* Guest Mode Alert if not logged in */}
      {!currentUser && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: "var(--space-lg)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Guest Mode:</strong> You must log in or sign up with your citizen identity before submitting statutory applications.
            </div>
          </div>
          <Link
            href="/login?redirect=/services"
            className="btn btn-primary"
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            <span>🔑 Login / Sign Up</span>
          </Link>
        </motion.div>
      )}

      <motion.div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-md)" }}
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {SERVICES.map((s) => (
          <motion.div
            key={s.id}
            variants={{
              initial: { opacity: 0, y: 14 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.18 } }}
          >
            <Link
              href={`/services/${s.id}`}
              style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
            >
              <div className="card card-clickable" style={{ height: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
                  <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2, color: "var(--brand-primary)" }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>{s.desc}</div>
                    <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
                      <span className="badge badge-info">{s.dept}</span>
                      <span className="badge badge-neutral" style={{ display: "flex", alignItems: "center", gap: 4 }}><Lucide.Clock size={10} /> {s.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
