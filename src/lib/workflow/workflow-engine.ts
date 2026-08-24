/**
 * LandStack — Statutory Multi-Department Workflow Engine (SIH 2026 PS #26014)
 * Coordinates inter-agency sequential approval pipelines across Revenue, Registration, Planning, & Municipality.
 */

export interface WorkflowStage {
  stage: number;
  name: string;
  department: string;
  deptCode: "Revenue" | "Registration" | "Planning" | "Municipality" | "Environment";
  requiredRole: string;
  description: string;
  slaDays: number;
}

export interface ServiceWorkflowDefinition {
  serviceType: string;
  serviceTitle: string;
  description: string;
  totalSlaDays: number;
  stages: WorkflowStage[];
}

export const STATUTORY_WORKFLOWS: Record<string, ServiceWorkflowDefinition> = {
  mutation: {
    serviceType: "mutation",
    serviceTitle: "Property Mutation",
    description: "Statutory title transfer in Jamabandi Panji-II revenue records with inter-agency deed & tax clearance.",
    totalSlaDays: 21,
    stages: [
      {
        stage: 1,
        name: "Revenue RoR & Panji-II Scrutiny",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Scrutinize Khatiyan, ancestry succession, Jamabandi #45 ledger, and physical possession.",
        slaDays: 7,
      },
      {
        stage: 2,
        name: "Deed & Encumbrance Cross-Check",
        department: "Registration Department",
        deptCode: "Registration",
        requiredRole: "REGISTRATION_OFFICER",
        description: "Verify registered sale deed volume, stamp duty index, and 30-year non-encumbrance.",
        slaDays: 7,
      },
      {
        stage: 3,
        name: "Municipal Property Tax Ledger",
        department: "Municipality Department",
        deptCode: "Municipality",
        requiredRole: "TAX_OFFICER",
        description: "Update municipal holding assessment and clear municipal property tax demand.",
        slaDays: 4,
      },
      {
        stage: 4,
        name: "Final Jamabandi Sanction & RoR Update",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Circle Officer (CO) issues final digital Mutation Sanction Order and updates Panji-II.",
        slaDays: 3,
      },
    ],
  },

  "building-permission": {
    serviceType: "building-permission",
    serviceTitle: "Building Permission",
    description: "Multi-department building plan sanction across Urban Planning, Revenue non-acquisition, and Municipality.",
    totalSlaDays: 25,
    stages: [
      {
        stage: 1,
        name: "Master Plan 2035 Zoning & FAR Compliance",
        department: "Planning Department",
        deptCode: "Planning",
        requiredRole: "PLANNING_OFFICER",
        description: "Verify Master Plan 2035 land use zoning, floor area ratio (FAR), and road width clearances.",
        slaDays: 10,
      },
      {
        stage: 2,
        name: "Land Title & Non-Acquisition Clearance",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Verify undisputed ownership title and confirm parcel is free from government acquisition.",
        slaDays: 7,
      },
      {
        stage: 3,
        name: "Municipal Structural Sanction & Fee Demand",
        department: "Municipality Department",
        deptCode: "Municipality",
        requiredRole: "TAX_OFFICER",
        description: "Structural safety verification, municipal building fee collection, and Sanction Order issuance.",
        slaDays: 8,
      },
    ],
  },

  "ownership-verification": {
    serviceType: "ownership-verification",
    serviceTitle: "Ownership Verification",
    description: "Cross-agency ownership title verification across Revenue Khatiyan and Registration Deed trail.",
    totalSlaDays: 7,
    stages: [
      {
        stage: 1,
        name: "Revenue Jamabandi Verification",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Verify Jamabandi ledger entry, Khata, Khesra, and current active title holder.",
        slaDays: 4,
      },
      {
        stage: 2,
        name: "Registry 30-Year Chain Clearance",
        department: "Registration Department",
        deptCode: "Registration",
        requiredRole: "REGISTRATION_OFFICER",
        description: "Cross-check registered instruments, sale deeds, and bank mortgage endorsements.",
        slaDays: 3,
      },
    ],
  },

  "encumbrance-certificate": {
    serviceType: "encumbrance-certificate",
    serviceTitle: "Encumbrance Certificate",
    description: "Search and certification of registered liabilities, mortgages, and bank attachments.",
    totalSlaDays: 5,
    stages: [
      {
        stage: 1,
        name: "Book-I Deed Register Search",
        department: "Registration Department",
        deptCode: "Registration",
        requiredRole: "REGISTRATION_OFFICER",
        description: "Examine 13+ year Book-I deed registers and property transaction indexes.",
        slaDays: 3,
      },
      {
        stage: 2,
        name: "Revenue Court Lien & Certificate Issuance",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Check for pending revenue court attachment orders and issue Non-Encumbrance Certificate.",
        slaDays: 2,
      },
    ],
  },

  "land-use-certificate": {
    serviceType: "land-use-certificate",
    serviceTitle: "Land Use Certificate",
    description: "Statutory Master Plan 2035 zoning compliance and agricultural land classification check.",
    totalSlaDays: 10,
    stages: [
      {
        stage: 1,
        name: "Master Plan Zoning Clearance",
        department: "Planning Department",
        deptCode: "Planning",
        requiredRole: "PLANNING_OFFICER",
        description: "Examine Master Plan 2035 zoning boundary, green buffer, and development restrictions.",
        slaDays: 6,
      },
      {
        stage: 2,
        name: "Revenue Land Conversion Scrutiny",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Verify agricultural to non-agricultural status and issue certified Land Use Order.",
        slaDays: 4,
      },
    ],
  },

  "property-tax": {
    serviceType: "property-tax",
    serviceTitle: "Property Tax Query",
    description: "Municipal property tax assessment and receipt generation.",
    totalSlaDays: 2,
    stages: [
      {
        stage: 1,
        name: "Municipal Assessment & Demand Ledger",
        department: "Municipality Department",
        deptCode: "Municipality",
        requiredRole: "TAX_OFFICER",
        description: "Calculate annual property tax holding assessment and issue digital payment receipt.",
        slaDays: 2,
      },
    ],
  },

  "ror-extract": {
    serviceType: "ror-extract",
    serviceTitle: "RoR Extract",
    description: "Digital extraction and Circle Officer signing of certified Khatiyan RoR copy.",
    totalSlaDays: 3,
    stages: [
      {
        stage: 1,
        name: "Revenue RoR Certification & e-Sign",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Digitally sign and certify official Khatiyan / Jamabandi Record of Rights extract.",
        slaDays: 3,
      },
    ],
  },

  "restriction-check": {
    serviceType: "restriction-check",
    serviceTitle: "Restriction Check",
    description: "Check if parcel falls under government acquisition, wetland, eco-sensitive zone, or tribal land ceiling.",
    totalSlaDays: 4,
    stages: [
      {
        stage: 1,
        name: "Revenue Acquisition & Ceiling Check",
        department: "Revenue Department",
        deptCode: "Revenue",
        requiredRole: "REVENUE_OFFICER",
        description: "Verify Bihar Land Ceiling Act, government acquisition notices, and Bhoodan records.",
        slaDays: 2,
      },
      {
        stage: 2,
        name: "Planning Eco-Sensitive & Floodplain Analysis",
        department: "Planning Department",
        deptCode: "Planning",
        requiredRole: "PLANNING_OFFICER",
        description: "Check wetland, waterbody buffer, and Master Plan environmental reservations.",
        slaDays: 2,
      },
    ],
  },
};

/**
 * Normalizes service type string to workflow key
 */
export function getWorkflowKey(serviceType: string): string {
  const norm = (serviceType || "").toLowerCase().trim();
  if (norm.includes("mutation")) return "mutation";
  if (norm.includes("building") || norm.includes("noc")) return "building-permission";
  if (norm.includes("ownership")) return "ownership-verification";
  if (norm.includes("encumbrance")) return "encumbrance-certificate";
  if (norm.includes("land-use") || norm.includes("zoning")) return "land-use-certificate";
  if (norm.includes("tax")) return "property-tax";
  if (norm.includes("ror") || norm.includes("khatiyan")) return "ror-extract";
  if (norm.includes("restriction")) return "restriction-check";
  return "mutation";
}

/**
 * Gets the full workflow definition for a service
 */
export function getWorkflowDefinition(serviceType: string): ServiceWorkflowDefinition {
  const key = getWorkflowKey(serviceType);
  return STATUTORY_WORKFLOWS[key] || STATUTORY_WORKFLOWS.mutation;
}

/**
 * Calculates current stage index from current step name or stage index
 */
export function getCurrentStageIndex(workflow: ServiceWorkflowDefinition, currentStep?: string): number {
  if (!currentStep) return 0;
  
  const lower = currentStep.toLowerCase();

  // 1. Prioritize explicit Stage number in step string: e.g. "Stage 4:", "[Stage 4]", "at Stage 2"
  const stageMatch = currentStep.match(/Stage\s*(\d+)/i);
  if (stageMatch) {
    const stageNum = parseInt(stageMatch[1], 10);
    const foundIdx = workflow.stages.findIndex((s) => s.stage === stageNum);
    if (foundIdx >= 0) return foundIdx;
  }

  // 2. Match exact stage name
  const nameIndex = workflow.stages.findIndex((s) => lower.includes(s.name.toLowerCase()));
  if (nameIndex >= 0) return nameIndex;

  // 3. If step specifies rejection by a specific department (e.g. "Rejected by Registration Department")
  if (lower.includes("reject")) {
    const rejectDeptIdx = workflow.stages.findIndex(
      (s) => lower.includes(s.department.toLowerCase()) || lower.includes(s.deptCode.toLowerCase())
    );
    if (rejectDeptIdx >= 0) return rejectDeptIdx;
  }

  // 4. If step specifies action required / documentation requested by a specific department
  if (lower.includes("action required") || lower.includes("requested")) {
    const reqDeptIdx = workflow.stages.findIndex(
      (s) => lower.includes(s.department.toLowerCase()) || lower.includes(s.deptCode.toLowerCase())
    );
    if (reqDeptIdx >= 0) return reqDeptIdx;
  }

  // 5. If already approved, certified, or completed (and NOT rejected) -> return last stage
  if (
    !lower.includes("reject") &&
    (lower.includes("approved & certified") ||
      lower.includes("all department clearances complete") ||
      lower.includes("final statutory approval"))
  ) {
    return Math.max(0, workflow.stages.length - 1);
  }

  // 6. Fallback to department matching
  const deptIndex = workflow.stages.findIndex(
    (s) => lower.includes(s.department.toLowerCase()) || lower.includes(s.deptCode.toLowerCase())
  );
  if (deptIndex >= 0) return deptIndex;

  return 0;
}

/**
 * Computes next stage transition for an application approval
 */
export function getNextWorkflowTransition(
  serviceType: string,
  currentStep: string,
  officerName: string,
  officerRole: string,
  officerDepartment: string,
  officerComments?: string
): {
  isFinalStage: boolean;
  nextStatus: "UNDER_REVIEW" | "APPROVED";
  nextDepartment: string;
  nextStep: string;
  nextStageNumber: number;
  totalStages: number;
  actionText: string;
} {
  const workflow = getWorkflowDefinition(serviceType);
  const currentIndex = getCurrentStageIndex(workflow, currentStep);
  const currentStageObj = workflow.stages[currentIndex];
  const nextIndex = currentIndex + 1;
  const isFinalStage = nextIndex >= workflow.stages.length;

  if (isFinalStage) {
    const actionText = officerComments
      ? `Final Statutory Approval granted by ${officerName} (${officerDepartment}): "${officerComments}"`
      : `Final Statutory Approval granted by ${officerName} (${officerDepartment}). All department clearances completed.`;

    return {
      isFinalStage: true,
      nextStatus: "APPROVED",
      nextDepartment: currentStageObj?.department || officerDepartment,
      nextStep: "Approved & Certified (All Department Clearances Complete)",
      nextStageNumber: workflow.stages.length,
      totalStages: workflow.stages.length,
      actionText,
    };
  }

  const nextStageObj = workflow.stages[nextIndex];
  const actionText = officerComments
    ? `Stage ${currentStageObj?.stage || 1} Approved by ${officerName} (${officerDepartment}). Forwarded to ${nextStageObj.department} for Stage ${nextStageObj.stage} [${nextStageObj.name}]: "${officerComments}"`
    : `Stage ${currentStageObj?.stage || 1} Approved by ${officerName} (${officerDepartment}). Forwarded to ${nextStageObj.department} for Stage ${nextStageObj.stage} [${nextStageObj.name}].`;

  return {
    isFinalStage: false,
    nextStatus: "UNDER_REVIEW",
    nextDepartment: nextStageObj.department,
    nextStep: `Pending ${nextStageObj.department} [Stage ${nextStageObj.stage}: ${nextStageObj.name}]`,
    nextStageNumber: nextStageObj.stage,
    totalStages: workflow.stages.length,
    actionText,
  };
}

export function calculateSlaStatus(createdAt: string | Date, targetDays: number): {
  deadline: Date;
  daysRemaining: number;
  status: "ON_TRACK" | "APPROACHING_SLA" | "SLA_BREACHED";
  badgeClass: string;
} {
  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + (targetDays || 7) * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.round(diffMs / (24 * 60 * 60 * 1000) * 10) / 10;

  if (diffMs < 0) {
    return { deadline, daysRemaining, status: "SLA_BREACHED", badgeClass: "badge-error" };
  } else if (daysRemaining <= 1) {
    return { deadline, daysRemaining, status: "APPROACHING_SLA", badgeClass: "badge-warning" };
  } else {
    return { deadline, daysRemaining, status: "ON_TRACK", badgeClass: "badge-success" };
  }
}
