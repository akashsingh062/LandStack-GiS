"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { UserRole, UserType, Permission } from "./types";
import { ROLE_PERMISSIONS } from "./rbac-matrix";
import { UserPersona, DEMO_PERSONAS } from "./personas";
import * as Lucide from "lucide-react";

export { DEMO_PERSONAS, type UserPersona };

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

export interface CitizenSignupPayload {
  name: string;
  phone: string;
  email?: string;
  state_code?: string;
  district_code?: string;
  circle_code?: string;
  village_code?: string;
}

export interface AuthContextType {
  currentUser: UserPersona;
  allPersonas: UserPersona[];
  isMounted: boolean;
  loginAs: (roleOrId: string) => void;
  signupCitizen: (payload: CitizenSignupPayload) => Promise<{ success: boolean; simulated_code?: string; error?: string }>;
  loginWithOtp: (
    phone: string,
    code: string,
    extra?: { fullName?: string; email?: string; district_code?: string; circle_code?: string; village_code?: string }
  ) => Promise<{ success: boolean; error?: string; redirect_url?: string }>;
  loginOfficial: (
    officialIdOrEmail: string,
    password?: string,
    department?: string
  ) => Promise<{ success: boolean; error?: string; redirect_url?: string }>;
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
        cachedUserPersona = { ...match, ...parsed };
      } else {
        cachedUserPersona = {
          id: parsed.id || "CITIZEN_CUSTOM",
          officialId: parsed.officialId || "CITIZEN-001",
          name: parsed.name || "Citizen User",
          role: parsed.role || "CITIZEN",
          userType: parsed.userType || "CITIZEN",
          title: parsed.title || "Citizen / Land Owner",
          department: parsed.department || "Public Citizen Portal",
          icon: "User",
          jurisdiction: parsed.jurisdiction || "Bihar",
          stateCode: parsed.stateCode || "BR",
          districtCode: parsed.districtCode || "BR-10",
          circleCode: parsed.circleCode || "Basopatti",
          description: "Registered Citizen User",
          landingUrl: parsed.landingUrl || "/",
          email: parsed.email || "",
          phone: parsed.phone || "",
        };
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

  const saveUserSession = useCallback((userObj: UserPersona) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
      localStorage.setItem("landstack_user", JSON.stringify(userObj));
      document.cookie = `landstack_role=${userObj.role}; path=/; max-age=86400; SameSite=Lax`;
      cachedUserJson = JSON.stringify(userObj);
      cachedUserPersona = userObj;
      window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: userObj }));
    } catch (e) {
      console.warn("Auth save error:", e);
    }
  }, []);

  const loginAs = useCallback((roleOrId: string) => {
    const match = DEMO_PERSONAS.find(
      (p) =>
        p.id === roleOrId ||
        p.officialId?.toLowerCase() === roleOrId.toLowerCase() ||
        p.role === roleOrId ||
        p.email.toLowerCase() === roleOrId.toLowerCase()
    ) || DEMO_PERSONAS[0];

    saveUserSession(match);
  }, [saveUserSession]);

  const signupCitizen = useCallback(async (payload: CitizenSignupPayload) => {
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Signup failed" };
      }
      return { success: true, simulated_code: data.simulated_code };
    } catch {
      return { success: false, error: "Network error during citizen signup" };
    }
  }, []);

  const loginWithOtp = useCallback(
    async (
      phone: string,
      code: string,
      extra?: { fullName?: string; email?: string; district_code?: string; circle_code?: string; village_code?: string }
    ) => {
      try {
        const res = await fetch("/api/v1/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            code,
            fullName: extra?.fullName,
            email: extra?.email,
            district_code: extra?.district_code,
            circle_code: extra?.circle_code,
            village_code: extra?.village_code,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Verification failed" };
        }

        const citizenSession: UserPersona = {
          id: data.user?.id || `citizen_${phone.slice(-10)}`,
          officialId: data.user?.officialId || `CITIZEN-${phone.slice(-4)}`,
          name: data.user?.name || extra?.fullName || "Citizen User",
          role: "CITIZEN",
          userType: "CITIZEN",
          title: "Citizen / Land Owner",
          department: "Public Citizen Portal",
          icon: "User",
          jurisdiction: data.user?.jurisdiction || "Basopatti, Madhubani (Bihar)",
          stateCode: data.user?.stateCode || "BR",
          districtCode: data.user?.districtCode || "BR-10",
          circleCode: data.user?.circleCode || "Basopatti",
          description: "Registered Citizen User",
          landingUrl: "/",
          email: data.user?.email || "",
          phone: data.user?.phone || phone,
        };

        saveUserSession(citizenSession);
        return { success: true, redirect_url: "/" };
      } catch {
        return { success: false, error: "Network error during OTP verification" };
      }
    },
    [saveUserSession]
  );

  const loginOfficial = useCallback(
    async (officialIdOrEmail: string, password?: string, department?: string) => {
      try {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            department,
            official_id: officialIdOrEmail,
            email: officialIdOrEmail,
            password: password || "sih@2026",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Official authentication failed" };
        }

        const officerSession: UserPersona = {
          id: data.user?.id || officialIdOrEmail,
          officialId: data.user?.officialId || officialIdOrEmail,
          name: data.user?.name || "Official Officer",
          role: data.user?.role || "REVENUE_OFFICER",
          userType: "STAFF",
          title: data.user?.title || "Department Officer",
          department: data.user?.department || "Department",
          icon: "Briefcase",
          jurisdiction: data.user?.jurisdiction || "State of Bihar",
          stateCode: data.user?.stateCode || "BR",
          districtCode: data.user?.districtCode || "ALL",
          circleCode: data.user?.circleCode || "ALL",
          description: data.user?.department || "Official Staff",
          landingUrl: data.user?.landingUrl || "/officer",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
        };

        saveUserSession(officerSession);
        return { success: true, redirect_url: data.redirect_url || officerSession.landingUrl };
      } catch {
        return { success: false, error: "Network error during official login" };
      }
    },
    [saveUserSession]
  );

  const logout = useCallback(() => {
    const citizen = DEMO_PERSONAS[0];
    saveUserSession(citizen);
  }, [saveUserSession]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      const allowed = (ROLE_PERMISSIONS as Record<string, Permission[]>)[currentUser.role] || [];
      return allowed.includes(permission);
    },
    [currentUser.role]
  );

  const checkJurisdiction = useCallback(
    (targetScope: { state_code?: string; district_code?: string; circle_code?: string }): boolean => {
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
    },
    [currentUser]
  );

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
        signupCitizen,
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
