/**
 * LandStack — Role-Permission Matrix (SIH 2026 PS #26014)
 * Strict authorization matrix across all 6 core government & citizen personas
 */

import { UserRole, Permission } from "./types";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CITIZEN: [
    "parcel.search",
    "parcel.read",
    "land360.view",
    "service.create",
    "service.view_own",
    "document.download_allowed",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",           // Limited public projection
    "VIEW_REGISTRATION",  // Limited public projection
    "VIEW_PLANNING",      // Limited public projection
    "VIEW_TAX"            // Limited to own assessments
  ],
  REVENUE_OFFICER: [
    "parcel.search",
    "parcel.read",
    "parcel.verify",
    "ror.read",
    "ror.verify",
    "mutation.read",
    "mutation.review",
    "workflow.process",
    "gis.view",
    "conflict.resolve",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "EDIT_ROR",
    "VIEW_REGISTRATION",
    "VIEW_PLANNING",
    "VIEW_TAX",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  REGISTRATION_OFFICER: [
    "parcel.search",
    "parcel.read",
    "registration.read",
    "registration.verify",
    "encumbrance.read",
    "encumbrance.update",
    "transaction.view",
    "gis.view",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_REGISTRATION",
    "EDIT_REGISTRATION",
    "VIEW_PLANNING",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  PLANNING_OFFICER: [
    "parcel.search",
    "parcel.read",
    "zoning.read",
    "landuse.read",
    "building_permission.read",
    "building_permission.review",
    "ai_alert.verify",
    "gis.view",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_PLANNING",
    "EDIT_BUILDING_PERMISSION",
    "RESOLVE_CONFLICT",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  ADMIN: [
    "parcel.search",
    "parcel.read",
    "user.manage",
    "role.manage",
    "adapter.manage",
    "system.config",
    "audit.view",
    "gis.view",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "EDIT_ROR",
    "VIEW_REGISTRATION",
    "EDIT_REGISTRATION",
    "VIEW_PLANNING",
    "EDIT_BUILDING_PERMISSION",
    "VIEW_TAX",
    "RESOLVE_CONFLICT",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  SUPER_ADMIN: [
    "parcel.search",
    "parcel.read",
    "parcel.verify",
    "state.analytics.view",
    "cross_dept.audit",
    "governance.override",
    "threat.manage",
    "user.manage",
    "role.manage",
    "adapter.manage",
    "system.config",
    "audit.view",
    "gis.view",
    "conflict.resolve",
    // Legacy tokens
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "EDIT_ROR",
    "VIEW_REGISTRATION",
    "EDIT_REGISTRATION",
    "VIEW_PLANNING",
    "EDIT_BUILDING_PERMISSION",
    "VIEW_TAX",
    "RESOLVE_CONFLICT",
    "MANAGE_USERS",
    "VIEW_AUDIT_LOGS",
    "DOWNLOAD_SIGNED_DOCS"
  ],
  TAX_OFFICER: [
    "parcel.search",
    "parcel.read",
    "gis.view",
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_TAX",
    "RESOLVE_CONFLICT"
  ],
  AUDITOR: [
    "parcel.search",
    "parcel.read",
    "audit.view",
    "cross_dept.audit",
    "gis.view",
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS",
    "VIEW_ROR",
    "VIEW_REGISTRATION",
    "VIEW_PLANNING",
    "VIEW_TAX",
    "VIEW_AUDIT_LOGS"
  ]
};

export const ROLE_DEFINITIONS: Record<UserRole, { title: string; department: string; level: string; icon: string; description: string }> = {
  CITIZEN: {
    title: "Citizen / Land Owner",
    department: "Public / Citizen Services",
    level: "Public / Limited",
    icon: "👨‍🌾",
    description: "Search parcels, view permitted Land 360°, submit service requests, track applications."
  },
  REVENUE_OFFICER: {
    title: "Revenue Circle Officer (CO)",
    department: "Revenue & Land Records",
    level: "Circle / Anchal Jurisdiction",
    icon: "👨‍💼",
    description: "RoR (Jamabandi), mutation review, ownership verification, boundary dispute resolution."
  },
  REGISTRATION_OFFICER: {
    title: "Sub-Registrar (DSR)",
    department: "Registration & Stamps",
    level: "District Registry Jurisdiction",
    icon: "📝",
    description: "Deed registration, transaction verification, encumbrances (NEC), mortgage recording."
  },
  PLANNING_OFFICER: {
    title: "Town Planning Officer",
    department: "Urban Planning & Housing",
    level: "Planning Area Jurisdiction",
    icon: "📐",
    description: "Master Plan 2035 zoning, building permissions, FAR compliance, AI satellite change review."
  },
  ADMIN: {
    title: "System Administrator",
    department: "Digital Land Governance Mission",
    level: "State System Administration",
    icon: "⚙️",
    description: "Users, roles, API adapters, system configuration, immutable audit trail."
  },
  SUPER_ADMIN: {
    title: "State Authority / Super Admin",
    department: "State Apex Land Governance",
    level: "Highest Oversight / State-Wide",
    icon: "👑",
    description: "Cross-department analytics, state-wide KPIs, inter-department dispute arbitration, policy governance."
  },
  TAX_OFFICER: {
    title: "Municipal Tax Officer",
    department: "Municipal Administration",
    level: "Nagar Panchayat / Ward",
    icon: "🏛️",
    description: "Property tax assessments, built-up area evaluation, demand notices."
  },
  AUDITOR: {
    title: "State Land Governance Auditor",
    department: "Audit & Vigilance Directorate",
    level: "State / UT Oversight",
    icon: "🔍",
    description: "Tamper-evident SHA-256 audit logs, DPDPA 2023 compliance, officer action traceability."
  }
};

