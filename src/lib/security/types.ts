/**
 * LandStack — Security, RBAC, ABAC & Privacy Types (SIH 2026 PS #26014)
 */

export type UserType = "CITIZEN" | "STAFF";

export type UserRole =
  | "CITIZEN"
  | "REVENUE_OFFICER"
  | "REGISTRATION_OFFICER"
  | "PLANNING_OFFICER"
  |"ADMIN"
  | "SUPER_ADMIN"
  | "TAX_OFFICER"
  | "AUDITOR";

export type Permission =
  // Standard dot-notation permissions
  | "parcel.search"
  | "parcel.read"
  | "parcel.verify"
  | "parcel.update"
  | "land360.view"
  | "service.create"
  | "service.view_own"
  | "document.download_allowed"
  | "ror.read"
  | "ror.verify"
  | "mutation.read"
  | "mutation.review"
  | "workflow.process"
  | "gis.view"
  | "conflict.resolve"
  | "registration.read"
  | "registration.verify"
  | "encumbrance.read"
  | "encumbrance.update"
  | "transaction.view"
  | "zoning.read"
  | "landuse.read"
  | "building_permission.read"
  | "building_permission.review"
  | "ai_alert.verify"
  | "user.manage"
  | "role.manage"
  | "adapter.manage"
  | "system.config"
  | "audit.view"
  | "state.analytics.view"
  | "cross_dept.audit"
  | "governance.override"
  | "threat.manage"
  // Legacy / Uppercase tokens for component compatibility
  | "SEARCH_PUBLIC_PARCEL"
  | "VIEW_PUBLIC_GIS"
  | "VIEW_ROR"
  | "EDIT_ROR"
  | "VIEW_REGISTRATION"
  | "EDIT_REGISTRATION"
  | "VIEW_PLANNING"
  | "EDIT_BUILDING_PERMISSION"
  | "VIEW_TAX"
  | "RESOLVE_CONFLICT"
  | "MANAGE_USERS"
  | "VIEW_AUDIT_LOGS"
  | "DOWNLOAD_SIGNED_DOCS";

export type DataClassification =
  | "PUBLIC"            // Spatial boundary, public land use, basic zoning
  | "RESTRICTED"        // Full ownership history, application details, internal officer notes
  | "SENSITIVE"         // Unmasked contact details, bank attachments, loan amounts, deed considerations
  | "HIGHLY_RESTRICTED"; // Security keys, internal audit tamper hashes, encryption secrets

export interface GeographicScope {
  state_code: string;       // e.g. 'BR', 'TN', 'CH', '*'
  district_code?: string;   // e.g. 'Madhubani', 'Coimbatore', '*'
  subdistrict_code?: string; // e.g. 'Basopatti', '*'
  circle_code?: string;     // Alias for subdistrict / revenue circle
  village_code?: string;    // e.g. '33', '*'
}

export interface SecurityPrincipal {
  user_id: string;
  name: string;
  role: UserRole;
  user_type?: UserType;
  department?: string;
  scope: GeographicScope;
  ip_address?: string;
}

export interface PolicyEvaluationRequest {
  principal: SecurityPrincipal;
  action: Permission;
  resource_type: string;
  resource_id?: string;
  target_scope?: GeographicScope;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  decision_code: "ALLOW" | "DENIED_INSUFFICIENT_ROLE" | "DENIED_OUT_OF_JURISDICTION" | "DENIED_ANONYMOUS";
  reason: string;
  evaluated_at: string;
}

