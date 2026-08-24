/**
 * POST /api/v1/auth/otp/verify
 * Validates citizen mobile OTP, saves/retrieves identity from database, and issues session token
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, normalizePhoneNumber } from "@/lib/security/otp-service";
import { ROLE_PERMISSIONS } from "@/lib/security/rbac-matrix";
import { getUserByPhone, registerOrUpdateCitizen } from "@/lib/security/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, fullName, email, district_code, circle_code, village_code } = body;

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

    // Look up existing user in database or register new citizen
    let dbUser = await getUserByPhone(normalized);

    if (!dbUser) {
      dbUser = await registerOrUpdateCitizen({
        name: fullName?.trim() || "Citizen User",
        phone: normalized,
        email: email?.trim(),
        district_code: district_code || "BR-10",
        circle_code: circle_code || "Basopatti",
        village_code: village_code || "Arghawa (33)",
      });
    } else if (fullName && fullName.trim()) {
      // Update name if provided
      dbUser = await registerOrUpdateCitizen({
        name: fullName.trim(),
        phone: normalized,
        email: email?.trim() || dbUser.email,
        district_code: district_code || dbUser.district_code,
        circle_code: circle_code || dbUser.circle_code,
        village_code: village_code || dbUser.village_code,
      });
    }

    const citizenUser = {
      id: dbUser.username || `citizen_${normalized.slice(-10)}`,
      officialId: dbUser.official_id || `CITIZEN-${normalized.slice(-4)}`,
      name: dbUser.name,
      role: "CITIZEN",
      userType: "CITIZEN",
      title: "Citizen / Land Owner",
      department: "Public Citizen Portal",
      phone: dbUser.phone || normalized,
      email: dbUser.email || `${dbUser.username}@biharbhumi.bihar.gov.in`,
      jurisdiction: dbUser.jurisdiction || "Basopatti, Madhubani (Bihar)",
      stateCode: dbUser.state_code || "BR",
      districtCode: dbUser.district_code || "BR-10",
      circleCode: dbUser.circle_code || "Basopatti",
      landingUrl: "/",
    };

    const token = Buffer.from(
      JSON.stringify({
        sub: citizenUser.id,
        official_id: citizenUser.officialId,
        phone: citizenUser.phone,
        name: citizenUser.name,
        role: citizenUser.role,
        user_type: citizenUser.userType,
        jurisdiction: citizenUser.jurisdiction,
        permissions: ROLE_PERMISSIONS.CITIZEN,
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      })
    ).toString("base64");

    const response = NextResponse.json({
      success: true,
      message: `Authentication successful. Welcome, ${citizenUser.name}.`,
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
