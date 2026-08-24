/**
 * LandStack — Land Rules Engine
 * Evaluates development status based on parcel context
 */

export interface RuleContext {
  landUse: string[];
  masterPlan: string[];
  restrictions: Array<{ type: string; severity: string }>;
  encumbrances: Array<{ type: string; status: string }>;
  buildingPermissions: Array<{ status: string; expiry_date?: string }>;
  disputes: Array<{ status: string }>;
  ror: { revenue_status?: string } | null;
}

export type DevelopmentStatus =
  | 'PERMITTED'
  | 'CONDITIONAL'
  | 'REVIEW_REQUIRED'
  | 'RESTRICTED'
  | 'BLOCKED';

export interface RuleResult {
  status: DevelopmentStatus;
  alerts: Array<{
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    code: string;
    message: string;
  }>;
  compliance_score: number;
  summary: string;
}

interface Rule {
  id: string;
  name: string;
  evaluate: (ctx: RuleContext) => { passed: boolean; alert?: RuleResult['alerts'][0] };
}

const RULES: Rule[] = [
  {
    id: 'R001',
    name: 'Active Dispute Check',
    evaluate: (ctx) => {
      const active = ctx.disputes.filter(d => !['Disposed', 'Settled', 'Withdrawn'].includes(d.status));
      if (active.length > 0) {
        return {
          passed: false,
          alert: { severity: 'CRITICAL', code: 'DISPUTE_ACTIVE', message: `${active.length} active dispute(s) — transactions may be restricted` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R002',
    name: 'Encumbrance Check',
    evaluate: (ctx) => {
      const active = ctx.encumbrances.filter(e => e.status === 'Active');
      if (active.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'ENCUMBRANCE_ACTIVE', message: `${active.length} active encumbrance(s) — mortgage/lien on property` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R003',
    name: 'Restriction Zone Check',
    evaluate: (ctx) => {
      const high = ctx.restrictions.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
      if (high.length > 0) {
        return {
          passed: false,
          alert: { severity: 'CRITICAL', code: 'RESTRICTION_HIGH', message: `Parcel falls in restricted zone: ${high.map(r => r.type).join(', ')}` },
        };
      }
      if (ctx.restrictions.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'RESTRICTION_MODERATE', message: `Parcel intersects ${ctx.restrictions.length} restriction zone(s)` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R004',
    name: 'Land Use Conformity',
    evaluate: (ctx) => {
      if (ctx.landUse.length === 0 || ctx.masterPlan.length === 0) return { passed: true };
      const mismatch = ctx.landUse.some(lu => !ctx.masterPlan.some(mp => mp.toLowerCase().includes(lu.toLowerCase())));
      if (mismatch) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'LANDUSE_MISMATCH', message: `Current use (${ctx.landUse.join(', ')}) may not align with master plan (${ctx.masterPlan.join(', ')})` },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R005',
    name: 'Building Permission Check',
    evaluate: (ctx) => {
      const expired = ctx.buildingPermissions.filter(bp => {
        if (bp.status === 'Expired') return true;
        if (bp.expiry_date && new Date(bp.expiry_date) < new Date()) return true;
        return false;
      });
      if (expired.length > 0) {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'BP_EXPIRED', message: 'Building permission has expired — renewal required' },
        };
      }
      return { passed: true };
    },
  },
  {
    id: 'R006',
    name: 'Revenue Arrears Check',
    evaluate: (ctx) => {
      if (ctx.ror?.revenue_status === 'Arrears') {
        return {
          passed: false,
          alert: { severity: 'WARNING', code: 'REVENUE_ARREARS', message: 'Land revenue is in arrears — clearance may be required' },
        };
      }
      return { passed: true };
    },
  },
];

export function evaluateRules(ctx: RuleContext): RuleResult {
  const alerts: RuleResult['alerts'] = [];
  let passedCount = 0;

  for (const rule of RULES) {
    const result = rule.evaluate(ctx);
    if (result.passed) {
      passedCount++;
    } else if (result.alert) {
      alerts.push(result.alert);
    }
  }

  const complianceScore = Math.round((passedCount / RULES.length) * 100);

  const hasCritical = alerts.some(a => a.severity === 'CRITICAL');
  const hasWarning = alerts.some(a => a.severity === 'WARNING');

  let status: DevelopmentStatus;
  let summary: string;

  if (hasCritical) {
    status = 'BLOCKED';
    summary = 'Development blocked — critical issues require resolution';
  } else if (alerts.length >= 3) {
    status = 'RESTRICTED';
    summary = 'Multiple issues detected — restricted development';
  } else if (hasWarning) {
    status = 'REVIEW_REQUIRED';
    summary = 'Review required — minor issues detected';
  } else if (alerts.length > 0) {
    status = 'CONDITIONAL';
    summary = 'Conditional development — conditions must be met';
  } else {
    status = 'PERMITTED';
    summary = 'No restrictions detected — development may proceed';
  }

  return { status, alerts, compliance_score: complianceScore, summary };
}

export type EncumbranceStatus = "none" | "closed" | "active" | "disputed" | "unknown";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type RiskConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface ParcelRiskInput {
  parcelId: string;
  cadastralAreaSqm?: number | null;
  rorAreaSqm?: number | null;
  ownerMatch?: boolean | null;
  mutationPendingDays?: number | null;
  encumbrance?: EncumbranceStatus | null;
  taxArrearsYears?: number | null;
  landUseViolation?: boolean | null;
  duplicateIdentifier?: boolean | null;
}

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  maximumPoints: number;
  evidence: string;
  available: boolean;
}

export interface ParcelRiskResult {
  score: number;
  level: RiskLevel;
  confidence: RiskConfidence;
  dataCompletenessPercent: number;
  recommendation: string;
  factors: RiskFactor[];
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  return "HIGH";
}

function getRecommendation(level: RiskLevel, confidence: RiskConfidence): string {
  if (confidence === "LOW") {
    return "Complete the missing department checks before any statutory decision.";
  }
  if (level === "HIGH") {
    return "Hold automatic clearance and route this parcel for inter-departmental field verification.";
  }
  if (level === "MEDIUM") {
    return "Request supporting documents and verify the highlighted records before approval.";
  }
  return "Continue standard processing and retain this assessment in the audit trail.";
}

export function scoreParcelRisk(input: ParcelRiskInput): ParcelRiskResult {
  const factors: RiskFactor[] = [];
  const hasAreas =
    typeof input.cadastralAreaSqm === "number" &&
    Number.isFinite(input.cadastralAreaSqm) &&
    input.cadastralAreaSqm > 0 &&
    typeof input.rorAreaSqm === "number" &&
    Number.isFinite(input.rorAreaSqm) &&
    input.rorAreaSqm > 0;

  if (hasAreas) {
    const mismatchPercent =
      (Math.abs(input.cadastralAreaSqm! - input.rorAreaSqm!) / input.cadastralAreaSqm!) * 100;
    const points = mismatchPercent <= 2 ? 0 : mismatchPercent <= 5 ? 8 : mismatchPercent <= 10 ? 16 : 25;
    factors.push({
      key: "areaMismatch",
      label: "Cadastral and RoR area mismatch",
      points,
      maximumPoints: 25,
      evidence: `${mismatchPercent.toFixed(1)}% difference after unit normalization.`,
      available: true,
    });
  } else {
    factors.push({
      key: "areaMismatch",
      label: "Cadastral and RoR area mismatch",
      points: 0,
      maximumPoints: 25,
      evidence: "Area comparison is unavailable.",
      available: false,
    });
  }

  const ownerAvailable = typeof input.ownerMatch === "boolean";
  factors.push({
    key: "ownerConflict",
    label: "Ownership record conflict",
    points: ownerAvailable && !input.ownerMatch ? 20 : 0,
    maximumPoints: 20,
    evidence: !ownerAvailable
      ? "RoR and registration ownership comparison is unavailable."
      : input.ownerMatch
        ? "No unresolved ownership conflict is recorded."
        : "An unresolved ownership mismatch is recorded.",
    available: ownerAvailable,
  });

  const mutationAvailable =
    typeof input.mutationPendingDays === "number" && Number.isFinite(input.mutationPendingDays);
  const mutationDays = clamp(input.mutationPendingDays ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const mutationPoints = !mutationAvailable ? 0 : mutationDays < 30 ? 0 : mutationDays <= 90 ? 5 : mutationDays <= 180 ? 10 : 15;
  factors.push({
    key: "mutationDelay",
    label: "Pending mutation delay",
    points: mutationPoints,
    maximumPoints: 15,
    evidence: !mutationAvailable
      ? "Mutation status is unavailable."
      : mutationDays < 30
        ? "No material mutation delay."
        : `Mutation has remained pending for ${Math.round(mutationDays)} days.`,
    available: mutationAvailable,
  });

  const encumbrance = input.encumbrance ?? "unknown";
  const encumbranceAvailable = encumbrance !== "unknown";
  const encumbrancePoints: Record<EncumbranceStatus, number> = {
    none: 0,
    closed: 4,
    active: 12,
    disputed: 15,
    unknown: 0,
  };
  const encumbranceEvidence: Record<EncumbranceStatus, string> = {
    none: "No recorded encumbrance.",
    closed: "A historical encumbrance is recorded as closed.",
    active: "An active charge or encumbrance is recorded.",
    disputed: "A disputed encumbrance is recorded.",
    unknown: "Encumbrance status is unavailable.",
  };
  factors.push({
    key: "encumbrance",
    label: "Encumbrance status",
    points: encumbrancePoints[encumbrance],
    maximumPoints: 15,
    evidence: encumbranceEvidence[encumbrance],
    available: encumbranceAvailable,
  });

  const taxAvailable = typeof input.taxArrearsYears === "number" && Number.isFinite(input.taxArrearsYears);
  const taxYears = clamp(input.taxArrearsYears ?? 0, 0, Number.MAX_SAFE_INTEGER);
  const taxPoints = !taxAvailable ? 0 : taxYears === 0 ? 0 : taxYears === 1 ? 3 : taxYears === 2 ? 6 : 10;
  factors.push({
    key: "taxArrears",
    label: "Property tax arrears",
    points: taxPoints,
    maximumPoints: 10,
    evidence: !taxAvailable
      ? "Municipal tax status is unavailable."
      : taxYears === 0
        ? "No property tax arrears recorded."
        : `${Math.round(taxYears)} year(s) of property tax arrears recorded.`,
    available: taxAvailable,
  });

  const landUseAvailable = typeof input.landUseViolation === "boolean";
  factors.push({
    key: "landUseViolation",
    label: "Land-use conflict",
    points: landUseAvailable && input.landUseViolation ? 10 : 0,
    maximumPoints: 10,
    evidence: !landUseAvailable
      ? "Planning or land-use validation is unavailable."
      : input.landUseViolation
        ? "An unresolved land-use or unauthorized development conflict is recorded."
        : "No unresolved land-use conflict is recorded.",
    available: landUseAvailable,
  });

  const duplicateAvailable = typeof input.duplicateIdentifier === "boolean";
  factors.push({
    key: "duplicateIdentifier",
    label: "Duplicate ULPIN or survey identifier",
    points: duplicateAvailable && input.duplicateIdentifier ? 5 : 0,
    maximumPoints: 5,
    evidence: !duplicateAvailable
      ? "Duplicate identifier check is unavailable."
      : input.duplicateIdentifier
        ? "The ULPIN or survey identifier appears in another active parcel record."
        : "No duplicate ULPIN or survey identifier found.",
    available: duplicateAvailable,
  });

  const score = factors.reduce((total, factor) => total + factor.points, 0);
  const dataCompletenessPercent = Math.round(
    (factors.filter((factor) => factor.available).length / factors.length) * 100,
  );
  const confidence: RiskConfidence =
    dataCompletenessPercent >= 86 ? "HIGH" : dataCompletenessPercent >= 70 ? "MEDIUM" : "LOW";
  const level = getRiskLevel(score);

  return {
    score,
    level,
    confidence,
    dataCompletenessPercent,
    recommendation: getRecommendation(level, confidence),
    factors,
  };
}
