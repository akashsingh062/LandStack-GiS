/**
 * POST /api/v1/auth/signup
 * Citizen Registration & Onboarding Pipeline (SIH 2026 PS #26014)
 * Captures citizen details (Name, Mobile, District, Circle, Village) and dispatches verification OTP
 */

import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/security/otp-service";
import { registerOrUpdateCitizen } from "@/lib/security/user-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, state_code, district_code, circle_code, village_code } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your full legal name as per land records." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // Persist citizen profile in Postgres/Supabase database
    const dbUser = await registerOrUpdateCitizen({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      state_code: state_code || "BR",
      district_code: district_code || "BR-10",
      circle_code: circle_code || "Basopatti",
      village_code: village_code || "Arghawa (33)",
    });

    // Dispatch simulated/real SMS OTP
    const otpResult = await sendOtp({ phone });

    if (!otpResult.success) {
      return NextResponse.json(
        {
          error: otpResult.message,
          cooldown_seconds: otpResult.cooldown_seconds,
          simulated_code: otpResult.simulated_code,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Registration initiated. Verification OTP sent to ${otpResult.masked_phone}.`,
      user: {
        id: dbUser.username,
        name: dbUser.name,
        phone: dbUser.phone,
        jurisdiction: dbUser.jurisdiction,
      },
      simulated_code: otpResult.simulated_code,
      expires_in_seconds: otpResult.expires_in_seconds,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Citizen registration failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
