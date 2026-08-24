/**
 * LandStack — Route RBAC Policy & Access Control Guard
 * Enforces role-based route restrictions and dynamic navigation filtering
 */

import { UserRole } from "./types";

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  allowedRoles: UserRole[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const ALL_ROLES: UserRole[] = [
  "CITIZEN",
  "REVENUE_OFFICER",
  "REGISTRATION_OFFICER",
  "PLANNING_OFFICER",
  "ADMIN",
  "SUPER_ADMIN",
  "TAX_OFFICER",
  "AUDITOR",
];

export const OFFICER_ROLES: UserRole[] = [
  "REVENUE_OFFICER",
  "REGISTRATION_OFFICER",
  "PLANNING_OFFICER",
  "ADMIN",
  "SUPER_ADMIN",
  "TAX_OFFICER",
];

// Full Navigation Schema with granular RBAC permissions
export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/", icon: "Home", label: "Dashboard", allowedRoles: ALL_ROLES },
      { href: "/map", icon: "Map", label: "GIS Map", allowedRoles: ALL_ROLES },
      { href: "/search", icon: "Search", label: "Search Land", allowedRoles: ALL_ROLES },
      { href: "/profile", icon: "User", label: "My Profile", allowedRoles: ALL_ROLES },
    ],
  },
  {
    label: "Citizen Services",
    items: [
      { href: "/services", icon: "ClipboardList", label: "Services", allowedRoles: ["CITIZEN"] },
      { href: "/applications", icon: "FileText", label: "My Applications", allowedRoles: ["CITIZEN"] },
    ],
  },
  {
    label: "Department Governance",
    items: [
      { href: "/officer", icon: "Briefcase", label: "Officer Portal", allowedRoles: OFFICER_ROLES },
      { href: "/officer/conflicts", icon: "AlertTriangle", label: "Data Conflicts", badge: "3", allowedRoles: ["REVENUE_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN", "AUDITOR"] },
    ],
  },
  {
    label: "Intelligence & Standards",
    items: [
      { href: "/admin/intelligence", icon: "Brain", label: "AI & Satellite AI", allowedRoles: ["ADMIN", "SUPER_ADMIN", "PLANNING_OFFICER", "REVENUE_OFFICER"] },
      { href: "/admin/adapters", icon: "Plug", label: "State Adapters", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
      { href: "/admin/security", icon: "Shield", label: "Security & Audit", allowedRoles: ["ADMIN", "SUPER_ADMIN", "AUDITOR"] },
      { href: "/admin", icon: "Settings", label: "Admin Overview", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
      { href: "/admin/import", icon: "Download", label: "Data Import", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
    ],
  },
];

// Strict Route Access Rules for URL Path Matching
export const ROUTE_ACCESS_RULES: { prefix: string; exact?: boolean; allowedRoles: UserRole[] }[] = [
  { prefix: "/login", allowedRoles: ALL_ROLES },
  { prefix: "/profile", allowedRoles: ALL_ROLES },
  { prefix: "/map", allowedRoles: ALL_ROLES },
  { prefix: "/search", allowedRoles: ALL_ROLES },
  { prefix: "/parcel", allowedRoles: ALL_ROLES },
  { prefix: "/", exact: true, allowedRoles: ALL_ROLES },
  { prefix: "/services", allowedRoles: ["CITIZEN", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/applications", allowedRoles: ["CITIZEN", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/officer/conflicts", allowedRoles: ["REVENUE_OFFICER", "PLANNING_OFFICER", "ADMIN", "SUPER_ADMIN", "AUDITOR"] },
  { prefix: "/officer", allowedRoles: OFFICER_ROLES },
  { prefix: "/admin/intelligence", allowedRoles: ["ADMIN", "SUPER_ADMIN", "PLANNING_OFFICER", "REVENUE_OFFICER"] },
  { prefix: "/admin/security", allowedRoles: ["ADMIN", "SUPER_ADMIN", "AUDITOR"] },
  { prefix: "/admin/adapters", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin/import", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/admin", exact: true, allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
];

/**
 * Checks if a given pathname is allowed for a user role
 */
export function checkRouteAccess(pathname: string, role?: UserRole | null): {
  allowed: boolean;
  requiredRoles: UserRole[];
} {
  // Always permit static / Next.js internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return { allowed: true, requiredRoles: ALL_ROLES };
  }

  // Public routes allowed for unauthenticated guests
  const publicRoutes = ["/", "/login", "/map", "/search", "/parcel"];
  const isPublic = publicRoutes.some(p => p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(p + "/"));

  if (!role) {
    return {
      allowed: isPublic,
      requiredRoles: ALL_ROLES,
    };
  }

  // Find most specific matching rule (sorted by longest prefix first)
  const matchedRule = [...ROUTE_ACCESS_RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((rule) => {
      if (rule.exact) {
        return pathname === rule.prefix;
      }
      return pathname === rule.prefix || pathname.startsWith(rule.prefix + "/");
    });

  if (!matchedRule) {
    // Default open if no specific restriction found
    return { allowed: true, requiredRoles: ALL_ROLES };
  }

  const isAllowed = matchedRule.allowedRoles.includes(role);
  return {
    allowed: isAllowed,
    requiredRoles: matchedRule.allowedRoles,
  };
}

/**
 * Returns filtered navigation sections containing only routes accessible by the current role
 */
export function getFilteredNavSections(role?: UserRole | null): NavSection[] {
  if (!role) {
    // Guest/Public: Only show public discovery links!
    return [
      {
        label: "Main",
        items: [
          { href: "/", icon: "Home", label: "Dashboard", allowedRoles: ALL_ROLES },
          { href: "/map", icon: "Map", label: "GIS Map", allowedRoles: ALL_ROLES },
          { href: "/search", icon: "Search", label: "Search Land", allowedRoles: ALL_ROLES },
        ],
      },
    ];
  }

  return ALL_NAV_SECTIONS.map((section) => ({
    label: section.label,
    items: section.items.filter((item) => item.allowedRoles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
