/**
 * LandStack — Government Departments & Staff Constants
 * Shared between Server API Routes and Client Components
 */

import { UserRole } from "./types";

export const COMMON_STAFF_PASSWORD = "sih@2026";

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultOfficerId: string;
  defaultOfficerName: string;
  role: UserRole;
}

export const DEPARTMENTS: DepartmentOption[] = [
  {
    id: "revenue",
    name: "Revenue & Land Records",
    code: "REV",
    description: "RoR Jamabandi, Land Records, Mutation Review, Ownership Verification",
    defaultOfficerId: "REV-001",
    defaultOfficerName: "Vikram Singh (Circle Officer - Basopatti)",
    role: "REVENUE_OFFICER",
  },
  {
    id: "registration",
    name: "Registration & Stamps",
    code: "REG",
    description: "Property Registration, Sale Deeds, Encumbrances (NEC), Mortgages",
    defaultOfficerId: "REG-001",
    defaultOfficerName: "Priya Sharma (Sub-Registrar - Madhubani)",
    role: "REGISTRATION_OFFICER",
  },
  {
    id: "planning",
    name: "Urban Planning & Housing",
    code: "PLAN",
    description: "Master Plan 2035, Zoning, Land Use & Building Permissions",
    defaultOfficerId: "PLAN-001",
    defaultOfficerName: "Anand Verma (Town Planning Officer)",
    role: "PLANNING_OFFICER",
  },
  {
    id: "municipality",
    name: "Municipal Property Tax",
    code: "TAX",
    description: "Property Tax Assessment, Built-up GIS Footprints, Arrears Collection",
    defaultOfficerId: "TAX-001",
    defaultOfficerName: "Sunita Rao (Executive Officer)",
    role: "TAX_OFFICER",
  },
  {
    id: "admin",
    name: "Revenue & Land Reforms Dept (State Admin)",
    code: "ADMIN",
    description: "User Provisioning, State Adapters, System Integrations, Access Policies",
    defaultOfficerId: "ADMIN-001",
    defaultOfficerName: "Rajeshwar Jha (State Nodal IT Admin)",
    role: "ADMIN",
  },
  {
    id: "governance",
    name: "Apex State Land Governance Directorate",
    code: "SUPER",
    description: "State-Wide Spatial KPIs, Multi-Dept Governance, Dispute Arbitration",
    defaultOfficerId: "SUPER-001",
    defaultOfficerName: "Dr. Sanjay Kumar, IAS (Principal Secretary)",
    role: "SUPER_ADMIN",
  },
  {
    id: "audit",
    name: "Audit & Vigilance Directorate",
    code: "AUDIT",
    description: "Tamper-Evident SHA-256 Audit Logs & DPDPA 2023 Compliance",
    defaultOfficerId: "AUDIT-001",
    defaultOfficerName: "Meenakshi Sundaram (Principal Auditor)",
    role: "AUDITOR",
  },
];
