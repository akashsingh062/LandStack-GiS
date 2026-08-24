"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { UserRole, UserType, Permission } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";
import * as Lucide from "lucide-react";

export const getLucideIcon = (iconName: string) => {
  switch (iconName) {
    case "User": return Lucide.User;
    case "Briefcase": return Lucide.Briefcase;
    case "FileSignature": return Lucide.FileSignature;
    case "Ruler": return Lucide.Ruler;
    case "Landmark": return Lucide.Landmark;
    case "Shield": return Lucide.Shield;
    case "ShieldCheck": return Lucide.ShieldCheck;
    case "Home": return Lucide.Home;
    case "Map": return Lucide.Map;
    case "LayoutDashboard": return Lucide.LayoutDashboard;
    case "Settings": return Lucide.Settings;
    case "Search": return Lucide.Search;
    default: return Lucide.User;
  }
};

import { UserPersona, DEMO_PERSONAS } from "./personas";
export { DEMO_PERSONAS, type UserPersona };

export interface AuthContextType {
  currentUser: UserPersona;
  allPersonas: UserPersona[];
  isMounted: boolean;
  loginAs: (roleOrId: string) => void;
  loginWithOtp: (phone: string, code: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  loginOfficial: (officialIdOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  checkJurisdiction: (targetScope: { state_code?: string; district_code?: string; circle_code?: string }) => boolean;
  getInitials: (name: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "landstack_active_user";
const AUTH_EVENT_NAME = "landstack_auth_change";

function subscribeToAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedUserJson = "";
let cachedUserPersona: UserPersona = DEMO_PERSONAS[0];

function getAuthSnapshot(): UserPersona {
  if (typeof window === "undefined") return DEMO_PERSONAS[0];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem("landstack_user");
    if (raw && raw !== cachedUserJson) {
      cachedUserJson = raw;
      const parsed = JSON.parse(raw);
      const match = DEMO_PERSONAS.find(
        (p) => p.id === parsed.id || p.officialId === parsed.officialId || p.role === parsed.role
      );
      if (match) {
        cachedUserPersona = match;
      }
    } else if (!raw) {
      cachedUserPersona = DEMO_PERSONAS[0];
    }
  } catch {}
  return cachedUserPersona;
}

function getAuthServerSnapshot(): UserPersona {
  return DEMO_PERSONAS[0];
}

function subscribeToMounted() {
  return () => {};
}
function getMountedSnapshot() {
  return true;
}
function getMountedServerSnapshot() {
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useSyncExternalStore(subscribeToAuth, getAuthSnapshot, getAuthServerSnapshot);
  const isMounted = useSyncExternalStore(subscribeToMounted, getMountedSnapshot, getMountedServerSnapshot);

  const loginAs = useCallback((roleOrId: string) => {
    const match = DEMO_PERSONAS.find(
      (p) =>
        p.id === roleOrId ||
        p.officialId?.toLowerCase() === roleOrId.toLowerCase() ||
        p.role === roleOrId ||
        p.email.toLowerCase() === roleOrId.toLowerCase()
    ) || DEMO_PERSONAS[0];

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(match));
      localStorage.setItem("landstack_user", JSON.stringify(match));
      document.cookie = `landstack_role=${match.role}; path=/; max-age=86400; SameSite=Lax`;
      cachedUserJson = JSON.stringify(match);
      cachedUserPersona = match;

      // Broadcast event to other listeners
      window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: match }));
    } catch (e) {
      console.warn("Auth save error:", e);
    }
  }, []);

  const loginWithOtp = useCallback(async (phone: string, code: string, fullName?: string) => {
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Verification failed" };
      }

      // Activate Citizen Persona
      const citizen = DEMO_PERSONAS[0];
      const citizenSession = {
        ...citizen,
        name: fullName?.trim() || citizen.name,
        phone: data.user?.phone || phone,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(citizenSession));
      localStorage.setItem("landstack_user", JSON.stringify(citizenSession));
      document.cookie = `landstack_role=CITIZEN; path=/; max-age=86400; SameSite=Lax`;
      cachedUserJson = JSON.stringify(citizenSession);
      cachedUserPersona = citizenSession;
      window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: citizenSession }));

      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error during OTP verification" };
    }
  }, []);

  const loginOfficial = useCallback(async (officialIdOrEmail: string, password?: string) => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ official_id: officialIdOrEmail, email: officialIdOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Official authentication failed" };
      }

      loginAs(data.user?.id || officialIdOrEmail);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error during official login" };
    }
  }, [loginAs]);

  const logout = useCallback(() => {
    const citizen = DEMO_PERSONAS[0];
    loginAs(citizen.id);
  }, [loginAs]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    const allowed = (ROLE_PERMISSIONS as Record<string, Permission[]>)[currentUser.role] || [];
    return allowed.includes(permission);
  }, [currentUser.role]);

  const checkJurisdiction = useCallback((targetScope: { state_code?: string; district_code?: string; circle_code?: string }): boolean => {
    if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" || currentUser.stateCode === "ALL") {
      return true;
    }
    if (targetScope.state_code && targetScope.state_code !== "*" && targetScope.state_code !== currentUser.stateCode) {
      return false;
    }
    if (
      targetScope.district_code &&
      targetScope.district_code !== "*" &&
      currentUser.districtCode !== "ALL" &&
      targetScope.district_code.toLowerCase() !== currentUser.districtCode.toLowerCase()
    ) {
      return false;
    }
    if (
      currentUser.role === "REVENUE_OFFICER" &&
      targetScope.circle_code &&
      targetScope.circle_code !== "*" &&
      currentUser.circleCode !== "ALL" &&
      targetScope.circle_code.toLowerCase() !== currentUser.circleCode.toLowerCase()
    ) {
      return false;
    }
    return true;
  }, [currentUser]);

  const getInitials = useCallback((name: string): string => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allPersonas: DEMO_PERSONAS,
        isMounted,
        loginAs,
        loginWithOtp,
        loginOfficial,
        logout,
        hasPermission,
        checkJurisdiction,
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
