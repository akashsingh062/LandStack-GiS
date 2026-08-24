/**
 * Explainable parcel risk score for LandStack.
 *
 * The score is deterministic so every officer can see the exact evidence and
 * points behind the result. An LLM may summarize this response, but it must
 * never change the score or approve/reject a land transaction.
 */

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
    return "Complete the missing department checks before any automatic decision.";
  }
  if (level === "HIGH") {
    return "Hold automatic approval and route this parcel for cross-department and field verification.";
  }
  if (level === "MEDIUM") {
    return "Request supporting documents and verify the highlighted records before approval.";
  }
  return "Continue standard processing and retain this assessment in the audit trail.";
}

/**
 * Scoring weights total 100: area 25, ownership 20, mutation 15,
 * encumbrance 15, tax 10, land-use 10, duplicate identifier 5.
 */
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
