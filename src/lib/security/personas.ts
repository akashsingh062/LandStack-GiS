/**
 * LandStack — 6 Core SIH Evaluation Personas & Data Definitions
 * Shared between Server API Routes and Client Components
 */

import { UserRole, UserType } from "./types";

export interface UserPersona {
  id: string;
  officialId: string;
  name: string;
  role: UserRole;
  userType: UserType;
  title: string;
  department: string;
  icon: string;
  jurisdiction: string;
  stateCode: string;
  districtCode: string;
  circleCode: string;
  description: string;
  landingUrl: string;
  email: string;
  phone: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  {
    id: "CITIZEN_RAMESH",
    officialId: "CITIZEN-001",
    name: "Ramesh Kumar",
    role: "CITIZEN",
    userType: "CITIZEN",
    title: "Citizen / Land Owner",
    department: "Public / Citizen Services",
    icon: "User",
    jurisdiction: "Basopatti, Madhubani (Bihar)",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description:
      "Owns survey parcels in Mauza Arghawa (33). Can view own Jamabandi RoR, track mutations, apply for citizen services.",
    landingUrl: "/",
    email: "citizen@biharbhumi.bihar.gov.in",
    phone: "",
  },
  {
    id: "OFFICER_CO_VIKRAM",
    officialId: "REV-001",
    name: "Vikram Singh",
    role: "REVENUE_OFFICER",
    userType: "STAFF",
    title: "Revenue Circle Officer (CO)",
    department: "Revenue & Land Records",
    icon: "Briefcase",
    jurisdiction: "Basopatti Circle, Madhubani",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description:
      "Statutory jurisdiction over Mauza Arghawa (33). Inspects Jamabandi RoR, verifies ownership, reviews mutations, resolves boundary disputes.",
    landingUrl: "/officer",
    email: "co.basopatti@bihar.gov.in",
    phone: "+91 94310 11111",
  },
  {
    id: "OFFICER_REG_PRIYA",
    officialId: "REG-001",
    name: "Priya Sharma",
    role: "REGISTRATION_OFFICER",
    userType: "STAFF",
    title: "Sub-Registrar (DSR)",
    department: "Registration & Stamps",
    icon: "FileSignature",
    jurisdiction: "Madhubani Registration District",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "ALL",
    description:
      "Registers sale deeds, evaluates encumbrance certificates (NEC), logs stamp duty transactions, and records mortgages.",
    landingUrl: "/officer?dept=Registration",
    email: "subreg.madhubani@bihar.gov.in",
    phone: "+91 94310 33333",
  },
  {
    id: "OFFICER_PLAN_ANAND",
    officialId: "PLAN-001",
    name: "Anand Verma",
    role: "PLANNING_OFFICER",
    userType: "STAFF",
    title: "Town Planning Officer",
    department: "Urban Planning & Housing",
    icon: "Ruler",
    jurisdiction: "Madhubani Planning Area",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "ALL",
    description:
      "Enforces Master Plan 2035 zoning regulations, evaluates FAR & building setbacks, and reviews AI satellite change alerts.",
    landingUrl: "/officer?dept=Planning",
    email: "tpo.madhubani@bihar.gov.in",
    phone: "+91 94310 44444",
  },
  {
    id: "ADMIN_STATE_RAJESHWAR",
    officialId: "ADMIN-001",
    name: "Rajeshwar Jha",
    role: "ADMIN",
    userType: "STAFF",
    title: "State Nodal IT Administrator",
    department: "Revenue & Land Reforms Dept",
    icon: "Settings",
    jurisdiction: "State of Bihar (State-wide)",
    stateCode: "BR",
    districtCode: "ALL",
    circleCode: "ALL",
    description:
      "Configures heterogeneous State Adapters, oversees security policies and ABAC rules, and manages system integrations.",
    landingUrl: "/admin",
    email: "nodal.landstack@bihar.gov.in",
    phone: "+91 94310 00000",
  },
  {
    id: "SUPER_ADMIN_SANJAY",
    officialId: "SUPER-001",
    name: "Dr. Sanjay Kumar, IAS",
    role: "SUPER_ADMIN",
    userType: "STAFF",
    title: "Principal Secretary & State Authority",
    department: "Apex State Land Governance Directorate",
    icon: "Shield",
    jurisdiction: "State of Bihar (Apex Authority)",
    stateCode: "BR",
    districtCode: "ALL",
    circleCode: "ALL",
    description:
      "Cross-department governance, state-wide spatial KPIs, inter-departmental conflict arbitration, and strategic policy oversight.",
    landingUrl: "/admin",
    email: "sec.revenue@bihar.gov.in",
    phone: "+91 94310 99999",
  },
  {
    id: "OFFICER_TAX_SUNITA",
    officialId: "TAX-001",
    name: "Sunita Rao",
    role: "TAX_OFFICER",
    userType: "STAFF",
    title: "Executive Officer (Nagar Panchayat)",
    department: "Municipality",
    icon: "Landmark",
    jurisdiction: "Nagar Panchayat Basopatti",
    stateCode: "BR",
    districtCode: "BR-10",
    circleCode: "Basopatti",
    description:
      "Manages property tax assessments, GIS built-up footprint evaluations, demand notices, and revenue collection.",
    landingUrl: "/officer?dept=Municipality",
    email: "eo.basopatti@bihar.gov.in",
    phone: "+91 94310 55555",
  },
  {
    id: "AUDITOR_CAG_MEENAKSHI",
    officialId: "AUDIT-001",
    name: "Meenakshi Sundaram",
    role: "AUDITOR",
    userType: "STAFF",
    title: "Principal Auditor (C&AG / Vigilance)",
    department: "Audit & Vigilance Directorate",
    icon: "ShieldCheck",
    jurisdiction: "Union of India (National Scope)",
    stateCode: "ALL",
    districtCode: "ALL",
    circleCode: "ALL",
    description:
      "Inspects immutable tamper-evident SHA-256 audit logs, tracks DPDPA 2023 consent records, and audits officer actions.",
    landingUrl: "/admin/security",
    email: "auditor.vigilance@cag.gov.in",
    phone: "+91 94310 22222",
  },
];
