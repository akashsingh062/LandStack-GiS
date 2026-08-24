import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getWorkflowDefinition } from "@/lib/workflow/workflow-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      service_type,
      parcel_ulpin,
      applicant_name = "Citizen Applicant",
      applicant_email,
      applicant_phone,
      purpose,
      details = {},
      priority = "NORMAL",
    } = body;

    if (!service_type) {
      return NextResponse.json({ error: "service_type is required" }, { status: 400 });
    }

    // Get statutory workflow definition
    const workflow = getWorkflowDefinition(service_type);
    const initialStage = workflow.stages[0];

    // Generate formatted Application ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const applicationNo = `LS-2026-${randomNum}`;

    const department = initialStage.department;
    const serviceTitle = workflow.serviceTitle;
    const initialStep = `Pending ${initialStage.department} [Stage 1: ${initialStage.name}]`;

    // Look up parcel_id if ULPIN is provided
    let parcelId: string | null = null;
    if (parcel_ulpin) {
      const pRes = await query(
        `SELECT parcel_id FROM gis.parcels WHERE ulpin = $1 OR parcel_id::text = $1 LIMIT 1`,
        [parcel_ulpin]
      );
      if (pRes.rows.length > 0) {
        parcelId = pRes.rows[0].parcel_id;
      }
    }

    // Insert service request with initial workflow stage & SLA
    const slaDays = workflow.totalSlaDays || 15;
    const insertRes = await query(
      `INSERT INTO governance.service_requests (
        application_no, service_type, parcel_id, parcel_ulpin,
        applicant_name, applicant_email, applicant_phone, department,
        purpose, details, priority, status, current_step,
        target_sla_days, sla_deadline, sla_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SUBMITTED', $12,
        $13, NOW() + ($14 || ' days')::interval, 'WITHIN_SLA', NOW(), NOW()
      )
      RETURNING *`,
      [
        applicationNo,
        serviceTitle,
        parcelId,
        parcel_ulpin,
        applicant_name,
        applicant_email,
        applicant_phone,
        department,
        purpose,
        JSON.stringify({ ...details, workflow_stage: 1, total_stages: workflow.stages.length }),
        priority,
        initialStep,
        slaDays,
        String(slaDays),
      ]
    );

    // Insert initial history entry
    await query(
      `INSERT INTO governance.application_history (
        application_no, status, action, performed_by, role, department, comments, created_at
      ) VALUES ($1, 'SUBMITTED', $2, $3, 'CITIZEN', 'Citizen Services', $4, NOW())`,
      [
        applicationNo,
        `Application submitted by citizen. Initiated ${workflow.stages.length}-stage statutory workflow at ${initialStage.department}.`,
        applicant_name,
        purpose || null,
      ]
    );

    return NextResponse.json({
      success: true,
      application: insertRes.rows[0],
      message: `Application ${applicationNo} submitted successfully! Routed to ${department}.`,
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/services] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
