import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const applicant = searchParams.get("applicant");
    const phone = searchParams.get("phone");

    let sql = `
      SELECT 
        request_id,
        application_no,
        service_type,
        parcel_id,
        parcel_ulpin,
        applicant_name,
        applicant_email,
        applicant_phone,
        department,
        purpose,
        details,
        priority,
        status,
        current_step,
        assigned_officer,
        target_sla_days,
        sla_deadline,
        sla_status,
        escalated,
        escalation_reason,
        precheck_results,
        created_at,
        updated_at
      FROM governance.service_requests
      WHERE 1=1
    `;
    const params: unknown[] = [];

    // Filter by department (matches "Revenue", "Revenue Department", "Revenue & Land Records", etc.)
    if (department && department !== "All") {
      params.push(`%${department}%`);
      sql += ` AND department ILIKE $${params.length}`;
    }

    // Filter by status
    if (status && status !== "ALL") {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    // Filter by applicant phone or name if provided
    if (phone) {
      // Normalize phone: strip spaces and match last 10 digits
      const digits = phone.replace(/\D/g, "").slice(-10);
      params.push(`%${digits}%`);
      sql += ` AND REPLACE(applicant_phone, ' ', '') ILIKE $${params.length}`;
    } else if (applicant) {
      params.push(`%${applicant}%`);
      sql += ` AND applicant_name ILIKE $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await query(sql, params);

    return NextResponse.json({
      applications: result.rows || [],
      count: result.rows ? result.rows.length : 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications] Database query error:", msg);
    return NextResponse.json({
      applications: [],
      count: 0,
      error: msg,
    }, { status: 500 });
  }
}
