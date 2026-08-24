/**
 * POST /api/v1/auth/login
 * Department Official Login (SIH 2026 PS #26014)
 * Validates Department selection, Official ID, and Common Staff Password (sih@2026) against Database
 */

import { NextRequest, NextResponse } from "next/server";
import { validateStaffLogin, DEPARTMENTS } from "@/lib/security/user-store";
import { ROLE_PERMISSIONS } from "@/lib/security/rbac-matrix";
import { UserRole } from "@/lib/security/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const department = body.department?.trim();
    const officialId = (body.official_id || body.officialId || body.email || body.id || "").trim();
    const password = body.password?.trim();

    if (!officialId) {
      return NextResponse.json(
        { error: "Official Employee ID or Government Email is required." },
        { status: 400 }
      );
    }

    // Validate with common staff password 'sih@2026' and database lookup
    const result = await validateStaffLogin({
      department,
      official_id: officialId,
      password,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          error:
            result.error ||
            "Authentication failed. Please verify your Department, Official ID, and Password (sih@2026).",
        },
        { status: 401 }
      );
    }

    const officer = result.user;
    const permissions = ROLE_PERMISSIONS[officer.role as UserRole] || [];

    // Determine Landing URL based on role
    let landingUrl = "/officer";
    if (officer.role === "ADMIN") landingUrl = "/admin";
    else if (officer.role === "SUPER_ADMIN") landingUrl = "/admin/intelligence";
    else if (officer.role === "AUDITOR") landingUrl = "/admin/security";
    else if (officer.department.includes("Registration")) landingUrl = "/officer?dept=Registration";
    else if (officer.department.includes("Planning")) landingUrl = "/officer?dept=Planning";
    else if (officer.department.includes("Tax") || officer.department.includes("Municipality")) landingUrl = "/officer?dept=Municipality";

    const token = Buffer.from(
      JSON.stringify({
        sub: officer.username,
        official_id: officer.official_id,
        email: officer.email,
        name: officer.name,
        role: officer.role,
        user_type: "STAFF",
        department: officer.department,
        jurisdiction: officer.jurisdiction,
        state_code: officer.state_code,
        district_code: officer.district_code,
        circle_code: officer.circle_code,
        permissions,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: `Authentication successful. Welcome, ${officer.name}.`,
      token,
      user: {
        id: officer.username,
        officialId: officer.official_id,
        name: officer.name,
        role: officer.role,
        userType: "STAFF",
        title: officer.title,
        department: officer.department,
        jurisdiction: officer.jurisdiction,
        stateCode: officer.state_code,
        districtCode: officer.district_code,
        circleCode: officer.circle_code,
        landingUrl,
      },
      permissions,
      redirect_url: landingUrl,
    });

    response.cookies.set("landstack_role", officer.role, {
      path: "/",
      maxAge: 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Official authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/v1/auth/login
 * Returns available departments for the official login dropdown
 */
export async function GET() {
  return NextResponse.json({
    departments: DEPARTMENTS,
    staff_password_hint: "Default Hackathon Staff Password: sih@2026",
    note: "Official accounts require Department selection and pre-provisioned Official ID.",
  });
}
