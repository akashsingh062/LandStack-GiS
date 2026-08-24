/**
 * LandStack — Policy Engine (RBAC + ABAC + Geographic Jurisdiction Scope)
 * Enforces dynamic multi-layered authorization policies (SIH 2026 PS #26014)
 */

import { PolicyEvaluationRequest, PolicyEvaluationResult } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";

export function evaluateAccessPolicy(req: PolicyEvaluationRequest): PolicyEvaluationResult {
  const { principal, action, target_scope } = req;
  const evaluated_at = new Date().toISOString();

  // 1. Role-Based Check (RBAC)
  const allowedPermissions = ROLE_PERMISSIONS[principal.role] || [];
  if (!allowedPermissions.includes(action)) {
    return {
      allowed: false,
      decision_code: "DENIED_INSUFFICIENT_ROLE",
      reason: `Role '${principal.role}' does not possess '${action}' permission under RBAC matrix.`,
      evaluated_at
    };
  }

  // 2. Attribute & Geographic Scope Check (ABAC)
  // Read-only public actions bypass geographic restrictions
  const isPublicRead = [
    "parcel.search",
    "parcel.read",
    "land360.view",
    "SEARCH_PUBLIC_PARCEL",
    "VIEW_PUBLIC_GIS"
  ].includes(action);

  if (isPublicRead) {
    return {
      allowed: true,
      decision_code: "ALLOW",
      reason: `Action '${action}' is authorized for public query scope.`,
      evaluated_at
    };
  }

  // Super Admin and System Admin have statewide / nationwide master authority
  if (
    principal.role === "ADMIN" ||
    principal.role === "SUPER_ADMIN" ||
    principal.scope.state_code === "*" ||
    principal.scope.state_code === "ALL"
  ) {
    return {
      allowed: true,
      decision_code: "ALLOW",
      reason: "Master governance authority granted across all jurisdictions.",
      evaluated_at
    };
  }

  // For departmental officers (Revenue, Registration, Planning) performing state/circle actions:
  if (target_scope && target_scope.state_code) {
    // Check State matching
    if (
      principal.scope.state_code !== "*" &&
      principal.scope.state_code !== "ALL" &&
      target_scope.state_code !== "*" &&
      principal.scope.state_code.toUpperCase() !== target_scope.state_code.toUpperCase()
    ) {
      return {
        allowed: false,
        decision_code: "DENIED_OUT_OF_JURISDICTION",
        reason: `Geographic Access Denied: Officer jurisdiction is State '${principal.scope.state_code}', but target parcel is in State '${target_scope.state_code}'.`,
        evaluated_at
      };
    }

    // Check District matching
    const pDistrict = (principal.scope.district_code || "").toLowerCase();
    const tDistrict = (target_scope.district_code || "").toLowerCase();
    if (
      pDistrict &&
      pDistrict !== "*" &&
      pDistrict !== "all" &&
      tDistrict &&
      tDistrict !== "*" &&
      tDistrict !== "all" &&
      pDistrict !== tDistrict
    ) {
      return {
        allowed: false,
        decision_code: "DENIED_OUT_OF_JURISDICTION",
        reason: `District Jurisdiction Denied: Officer assigned to '${principal.scope.district_code}', target parcel is in '${target_scope.district_code}'.`,
        evaluated_at
      };
    }

    // Check Circle / Anchal matching (specifically for Revenue Circle Officer)
    const pCircle = (principal.scope.circle_code || principal.scope.subdistrict_code || "").toLowerCase();
    const tCircle = (target_scope.circle_code || target_scope.subdistrict_code || "").toLowerCase();
    if (
      principal.role === "REVENUE_OFFICER" &&
      pCircle &&
      pCircle !== "*" &&
      pCircle !== "all" &&
      tCircle &&
      tCircle !== "*" &&
      tCircle !== "all" &&
      pCircle !== tCircle
    ) {
      return {
        allowed: false,
        decision_code: "DENIED_OUT_OF_JURISDICTION",
        reason: `Circle Jurisdiction Denied: Revenue Officer assigned to Circle '${principal.scope.circle_code || principal.scope.subdistrict_code}', target parcel is in Circle '${target_scope.circle_code || target_scope.subdistrict_code}'.`,
        evaluated_at
      };
    }
  }

  return {
    allowed: true,
    decision_code: "ALLOW",
    reason: `Access Granted: Principal '${principal.name}' (${principal.role}) verified within authorized jurisdiction '${principal.scope.state_code}/${principal.scope.district_code || 'All'}/${principal.scope.circle_code || 'All'}'.`,
    evaluated_at
  };
}

