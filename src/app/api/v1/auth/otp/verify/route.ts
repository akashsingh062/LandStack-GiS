/**
 * POST /api/v1/auth/otp/verify
 * Validates citizen mobile OTP, provisions session token, and establishes identity
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, normalizePhoneNumber } from "@/lib/security/otp-service";
import { ROLE_PERMISSIONS } from "@/lib/security/rbac-matrix";
import { DEMO_PERSONAS } from "@/lib/security/personas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, fullName } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit OTP are required." },
        { status: 400 }
      );
    }

    const verifyResult = await verifyOtp(phone, code);

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error: verifyResult.message,
          attempts_left: verifyResult.attempts_left,
        },
        { status: 400 }
      );
    }

    const normalized = normalizePhoneNumber(phone);
    // Find existing persona or create standard citizen session
    const defaultCitizen = DEMO_PERSONAS.find((p) => p.role === "CITIZEN") || DEMO_PERSONAS[0];

    const citizenUser = {
      id: defaultCitizen.id,
      name: fullName?.trim() || defaultCitizen.name,
      role: "CITIZEN",
      user_type: "CITIZEN",
      title: "Citizen / Land Owner",
      department: "Public Citizen Portal",
      phone: normalized,
      email: defaultCitizen.email,
      jurisdiction: defaultCitizen.jurisdiction,
      stateCode: defaultCitizen.stateCode,
      districtCode: defaultCitizen.districtCode,
      circleCode: defaultCitizen.circleCode,
      landingUrl: "/",
    };

    const token = Buffer.from(
      JSON.stringify({
        sub: citizenUser.id,
        phone: citizenUser.phone,
        name: citizenUser.name,
        role: citizenUser.role,
        user_type: citizenUser.user_type,
        jurisdiction: citizenUser.jurisdiction,
        permissions: ROLE_PERMISSIONS.CITIZEN,
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful.",
      token,
      user: citizenUser,
      permissions: ROLE_PERMISSIONS.CITIZEN,
      redirect_url: "/",
    });

    // Set auth cookie
    response.cookies.set("landstack_role", "CITIZEN", {
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OTP Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
