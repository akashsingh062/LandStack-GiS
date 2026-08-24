/**
 * POST /api/v1/auth/otp/send
 * Initiates mobile OTP verification for Citizen onboarding and login
 */

import { NextRequest, NextResponse } from "next/server";
import { sendOtp } from "@/lib/security/otp-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const result = await sendOtp({ phone });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message,
          cooldown_seconds: result.cooldown_seconds,
          simulated_code: result.simulated_code,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
