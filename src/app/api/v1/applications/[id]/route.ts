import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  getNextWorkflowTransition,
  getWorkflowDefinition,
  getCurrentStageIndex,
} from "@/lib/workflow/workflow-engine";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const appRes = await query(
      `SELECT * FROM governance.service_requests WHERE application_no = $1 OR request_id::text = $1 LIMIT 1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    const historyRes = await query(
      `SELECT * FROM governance.application_history WHERE application_no = $1 ORDER BY created_at ASC`,
      [application.application_no]
    );

    return NextResponse.json({
      application,
      history: historyRes.rows,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications/[id]] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function checkOfficerDepartmentJurisdiction(
  officerRole: string,
  officerDept: string,
  appDept: string
): boolean {
  if (officerRole === "SUPER_ADMIN" || officerRole === "ADMIN" || officerRole === "AUDITOR") {
    return true;
  }
  const oDept = (officerDept || "").toLowerCase();
  const aDept = (appDept || "").toLowerCase();

  if (officerRole === "REVENUE_OFFICER" && aDept.includes("revenue")) return true;
  if (officerRole === "REGISTRATION_OFFICER" && (aDept.includes("registration") || aDept.includes("stamps"))) return true;
  if (officerRole === "PLANNING_OFFICER" && (aDept.includes("planning") || aDept.includes("housing"))) return true;
  if (officerRole === "TAX_OFFICER" && (aDept.includes("tax") || aDept.includes("municipality"))) return true;

  if (oDept && aDept && (aDept.includes(oDept) || oDept.includes(aDept))) {
    return true;
  }

  return false;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { 
      action,
      status, 
      current_step,
      officer_name = "Land Officer Vikram Singh", 
      role = "REVENUE_OFFICER",
      department = "Revenue Department",
      comments = "",
      escalated,
      escalation_reason
    } = body;

    const appRes = await query(
      `SELECT * FROM governance.service_requests WHERE application_no = $1 OR request_id::text = $1 LIMIT 1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = appRes.rows[0];

    // Enforce Statutory Department Jurisdiction
    const hasJurisdiction = checkOfficerDepartmentJurisdiction(role, department, application.department);
    if (!hasJurisdiction) {
      return NextResponse.json(
        {
          error: `Statutory Jurisdiction Error: Officer '${officer_name}' (${department}) cannot verify or take action on an application currently under review by '${application.department}'.`,
        },
        { status: 403 }
      );
    }

    let newStatus = application.status;
    let newStep = application.current_step;
    let targetDepartment = application.department;
    let actionText = "";

    const determinedAction = action || (status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : status === "ACTION_REQUIRED" ? "REQUEST_INFO" : "UPDATE");

    if (determinedAction === "APPROVE") {
      const transition = getNextWorkflowTransition(
        application.service_type,
        application.current_step,
        officer_name,
        role,
        department,
        comments
      );

      newStatus = transition.nextStatus;
      newStep = transition.nextStep;
      targetDepartment = transition.nextDepartment;
      actionText = transition.actionText;
    } else if (determinedAction === "REJECT") {
      const workflow = getWorkflowDefinition(application.service_type);
      const curIdx = getCurrentStageIndex(workflow, application.current_step);
      const stageObj = workflow.stages[curIdx] || workflow.stages[0];

      newStatus = "REJECTED";
      newStep = `Rejected by ${department} [Stage ${stageObj.stage}: ${stageObj.name}]`;
      targetDepartment = department;
      actionText = comments 
        ? `Application Rejected at Stage ${stageObj.stage} (${stageObj.name}) by ${officer_name} (${department}): "${comments}"`
        : `Application Rejected at Stage ${stageObj.stage} (${stageObj.name}) by ${officer_name} (${department}) due to statutory non-compliance.`;
    } else if (determinedAction === "REQUEST_INFO") {
      const workflow = getWorkflowDefinition(application.service_type);
      const curIdx = getCurrentStageIndex(workflow, application.current_step);
      const stageObj = workflow.stages[curIdx] || workflow.stages[0];

      newStatus = "ACTION_REQUIRED";
      newStep = `Action Required - Additional Documentation Requested by ${department} [Stage ${stageObj.stage}: ${stageObj.name}]`;
      targetDepartment = department;
      actionText = comments
        ? `Additional Documents Requested at Stage ${stageObj.stage} by ${officer_name} (${department}): "${comments}"`
        : `Additional Documents Requested at Stage ${stageObj.stage} by ${officer_name} (${department}).`;
    } else if (determinedAction === "ESCALATE") {
      newStatus = application.status;
      newStep = `Escalated SLA - Under Review (${department})`;
      actionText = `SLA Escalation initiated by ${officer_name} (${department}): "${comments || "Statutory turnaround exceeded"}"`;
    } else {
      newStatus = status || application.status;
      newStep = current_step || application.current_step;
      actionText = comments ? `Action [${newStatus}]: ${comments}` : `Application updated to ${newStatus}`;
    }

    const isEscalated = escalated !== undefined ? escalated : (determinedAction === "ESCALATE" ? true : application.escalated);
    const escReason = escalation_reason || (determinedAction === "ESCALATE" ? comments : application.escalation_reason);

    const updateRes = await query(
      `UPDATE governance.service_requests
       SET status = $1, current_step = $2, department = $3, assigned_officer = $4, 
           escalated = $5, escalation_reason = $6, updated_at = NOW()
       WHERE application_no = $7
       RETURNING *`,
      [newStatus, newStep, targetDepartment, officer_name, isEscalated, escReason, application.application_no]
    );

    await query(
      `INSERT INTO governance.application_history (
        application_no, status, action, performed_by, role, department, comments, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        application.application_no,
        newStatus,
        actionText,
        officer_name,
        role,
        department,
        comments || null,
      ]
    );

    return NextResponse.json({
      success: true,
      application: updateRes.rows[0],
      message: `Application ${application.application_no} updated: ${actionText}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[API /api/v1/applications/[id] PATCH] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
