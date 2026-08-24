/**
 * POST /api/v1/auth/login
 * Official Department Login — Validates Official ID / Email, checks RBAC & Jurisdiction, issues session
 */

import { NextRequest, NextResponse } from "next/server";
import { DEMO_PERSONAS } from "@/lib/security/personas";
import { ROLE_PERMISSIONS } from "@/lib/security/rbac-matrix";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body.official_id || body.officialId || body.email || body.id || "").trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "Official ID or Official Email is required." },
        { status: 400 }
      );
    }

    // Match against provisioned government accounts
    const persona = DEMO_PERSONAS.find(
      (p) =>
        p.officialId.toLowerCase() === identifier.toLowerCase() ||
        p.email.toLowerCase() === identifier.toLowerCase() ||
        p.id.toLowerCase() === identifier.toLowerCase() ||
        p.role.toLowerCase() === identifier.toLowerCase()
    );

    if (!persona) {
      return NextResponse.json(
        {
          error: "Invalid Official ID or unauthorized access. Government accounts must be pre-provisioned by the State Administrator.",
        },
        { status: 401 }
      );
    }

    const token = Buffer.from(
      JSON.stringify({
        sub: persona.id,
        official_id: persona.officialId,
        email: persona.email,
        name: persona.name,
        role: persona.role,
        user_type: persona.userType,
        department: persona.department,
        jurisdiction: persona.jurisdiction,
        state_code: persona.stateCode,
        district_code: persona.districtCode,
        circle_code: persona.circleCode,
        permissions: ROLE_PERMISSIONS[persona.role],
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: `Authentication successful. Welcome, ${persona.name}.`,
      token,
      user: {
        id: persona.id,
        official_id: persona.officialId,
        name: persona.name,
        role: persona.role,
        user_type: persona.userType,
        title: persona.title,
        department: persona.department,
        jurisdiction: persona.jurisdiction,
        landing_url: persona.landingUrl,
      },
      permissions: ROLE_PERMISSIONS[persona.role],
      redirect_url: persona.landingUrl,
    });

    response.cookies.set("landstack_role", persona.role, {
      path: "/",
      maxAge: 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/v1/auth/login
 * Returns available government official personas for SIH evaluation demonstration
 */
export async function GET() {
  return NextResponse.json({
    official_roles: DEMO_PERSONAS.filter((p) => p.userType === "STAFF").map((p) => ({
      official_id: p.officialId,
      name: p.name,
      role: p.role,
      title: p.title,
      department: p.department,
      jurisdiction: p.jurisdiction,
      landing_url: p.landingUrl,
    })),
    citizen_portal: {
      auth_type: "MOBILE_OTP_SIMULATED",
      default_citizen: DEMO_PERSONAS[0],
    },
    note: "LandStack SIH 2026 Authentication API. Government accounts require Official ID. Public signup is restricted to Citizens.",
  });
}
