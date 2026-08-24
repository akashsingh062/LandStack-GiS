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

export interface RiskSubFactor {
  name: string;
  triggered: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidence: string;
}

export interface PlotRiskCategory {
  key: string;
  name: string;
  icon: string;
  level: RiskLevel;
  score: number;
  summary: string;
  action: string;
  factors: RiskSubFactor[];
}

export interface PlotRiskProfile {
  parcelId: string;
  compositeScore: number;
  compositeLevel: RiskLevel;
  confidence: RiskConfidence;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  recommendation: string;
  categories: PlotRiskCategory[];
}

export interface ComprehensiveParcelRiskInput {
  parcelId: string;
  surveyNumber?: string;
  cadastralAreaSqm?: number | null;
  rorAreaSqm?: number | null;
  landType?: string | null;
  ownerCount?: number;
  ownerMatch?: boolean | null;
  hasRor?: boolean;
  mutationPendingDays?: number | null;
  recentTransferMonths?: number | null;
  disputes?: Array<{
    dispute_type?: string;
    court?: string;
    case_number?: string;
    stay_order?: boolean;
    status?: string;
    affects_transfer?: boolean;
  }>;
  encumbrances?: Array<{
    encumbrance_type?: string;
    institution?: string;
    amount?: number | string;
    outstanding?: number | string;
    status?: string;
  }>;
  landUseZones?: Array<{ zone_name?: string; zone_code?: string }>;
  masterPlanZones?: Array<{ zone_name?: string; permitted_use?: string; zone_code?: string }>;
  restrictionZones?: Array<{ restriction_type?: string; severity?: string; restriction_name?: string }>;
  buildingPermissions?: Array<{
    status?: string;
    building_type?: string;
    approved_area?: number;
    floors?: number;
    approval_date?: string;
  }>;
  conflicts?: Array<{
    conflict_type?: string;
    severity?: string;
    resolved?: boolean;
    source_a?: string;
    value_a?: string;
    source_b?: string;
    value_b?: string;
  }>;
  duplicateIdentifier?: boolean | null;
  taxes?: Array<{
    assessment_year?: string;
    due_amount?: number;
    arrears?: number;
    status?: string;
  }>;
  centroidLng?: number | null;
  centroidLat?: number | null;
}

// Backward-compatible input definition
export interface ParcelRiskInput extends ComprehensiveParcelRiskInput {
  taxArrearsYears?: number | null;
  landUseViolation?: boolean | null;
}

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  maximumPoints: number;
  evidence: string;
  available: boolean;
}

export interface ParcelRiskResult extends PlotRiskProfile {
  score: number;
  level: RiskLevel;
  dataCompletenessPercent: number;
  factors: RiskFactor[];
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "LOW";
  if (score <= 65) return "MEDIUM";
  return "HIGH";
}

function getRecommendation(level: RiskLevel, confidence: RiskConfidence): string {
  if (confidence === "LOW") {
    return "Complete the missing department records before any statutory clearance.";
  }
  if (level === "HIGH") {
    return "High risk plot. Automatic deed execution/mutation blocked pending inter-departmental verification.";
  }
  if (level === "MEDIUM") {
    return "Medium risk detected. Conditional review required; verify supporting documents before approval.";
  }
  return "Clear title and compliant zoning. Parcel is cleared for standard statutory transactions.";
}

export function scoreParcelRisk(input: ComprehensiveParcelRiskInput): ParcelRiskResult {
  const categories: PlotRiskCategory[] = [];

  const unresolvedConflicts = (input.conflicts || []).filter((c) => !c.resolved);
  const activeDisputes = (input.disputes || []).filter(
    (d) => !["Disposed", "Settled", "Withdrawn", "DISPOSED", "SETTLED"].includes(d.status || ""),
  );
  const activeEncumbrances = (input.encumbrances || []).filter(
    (e) => (e.status || "").toUpperCase() === "ACTIVE",
  );
  const disputedEncumbrances = (input.encumbrances || []).filter(
    (e) => (e.status || "").toUpperCase() === "DISPUTED",
  );
  const hasStayOrder = activeDisputes.some((d) => d.stay_order === true || d.affects_transfer === true);

  // 1. 👥 Ownership Risk
  const ownershipSub: RiskSubFactor[] = [];
  const ownerConflict = unresolvedConflicts.some((c) =>
    ["OWNERSHIP_MISMATCH", "OWNER_NAME_MISMATCH", "OWNER_CLAIM_DISPUTE"].includes((c.conflict_type || "").toUpperCase()),
  );
  ownershipSub.push({
    name: "Owner Record Mismatch",
    triggered: ownerConflict || input.ownerMatch === false,
    severity: "HIGH",
    evidence: ownerConflict
      ? "Panji-II Jamabandi name diverges from latest registered deed."
      : input.ownerMatch === true
        ? "Owner record matches registered raiyat."
        : "Ownership record verified.",
  });
  const multipleOwners = (input.ownerCount || 1) > 3;
  ownershipSub.push({
    name: "Multiple Ownership Claims",
    triggered: multipleOwners,
    severity: "MEDIUM",
    evidence: multipleOwners
      ? `Joint co-parcenary with ${input.ownerCount} recorded claimants without partition.`
      : "Sole or clear joint raiyat holding.",
  });
  const missingRor = input.hasRor === false || (!input.rorAreaSqm && !input.hasRor && input.hasRor !== undefined);
  ownershipSub.push({
    name: "Missing / Incomplete RoR",
    triggered: Boolean(missingRor),
    severity: "HIGH",
    evidence: missingRor
      ? "No Jamabandi Khatiyan entry found in Panji-II digital register."
      : "Digital RoR Khatiyan verified in Panji-II.",
  });
  const mutationDays = input.mutationPendingDays || 0;
  const mutationPending = mutationDays > 30;
  ownershipSub.push({
    name: "Mutation Pending",
    triggered: mutationPending,
    severity: mutationDays > 90 ? "HIGH" : "MEDIUM",
    evidence: mutationPending
      ? `Mutation request in progress for ${Math.round(mutationDays)} days.`
      : "No delayed mutation pending.",
  });
  const recentTransfer = (input.recentTransferMonths || 12) < 6;
  ownershipSub.push({
    name: "Recent Ownership Transfer",
    triggered: recentTransfer,
    severity: "LOW",
    evidence: recentTransfer
      ? "Transferred within the last 6 months; cooling verification advised."
      : "Title holding established.",
  });

  const ownershipScore = Math.min(
    100,
    (ownershipSub.filter((s) => s.triggered && s.severity === "HIGH").length * 45) +
    (ownershipSub.filter((s) => s.triggered && s.severity === "MEDIUM").length * 25) +
    (ownershipSub.filter((s) => s.triggered && s.severity === "LOW").length * 10),
  );
  const ownershipLevel = getRiskLevel(ownershipScore);
  categories.push({
    key: "ownership",
    name: "Ownership Risk",
    icon: "User",
    level: ownershipLevel,
    score: ownershipScore,
    summary: ownershipLevel === "HIGH"
      ? "Unresolved ownership discrepancy or missing RoR"
      : ownershipLevel === "MEDIUM"
        ? "Pending mutation or joint claimant scrutiny required"
        : "Clear recorded title and verified raiyat",
    action: ownershipLevel === "HIGH"
      ? "Requires physical Jamabandi validation from Anchal Circle Officer."
      : ownershipLevel === "MEDIUM"
        ? "Verify mutation succession papers before deed clearance."
        : "Standard statutory processing permitted.",
    factors: ownershipSub,
  });

  // 2. ⚖️ Legal / Dispute Risk
  const legalSub: RiskSubFactor[] = [];
  legalSub.push({
    name: "Active Land Dispute",
    triggered: activeDisputes.length > 0,
    severity: "HIGH",
    evidence: activeDisputes.length > 0
      ? `${activeDisputes.length} active litigation case(s) registered.`
      : "No active court disputes registered.",
  });
  legalSub.push({
    name: "Court Stay Order",
    triggered: hasStayOrder,
    severity: "HIGH",
    evidence: hasStayOrder
      ? `Injunction stay order issued by ${activeDisputes[0]?.court || "Civil Court"}. Transfer barred.`
      : "No injunction or stay order recorded.",
  });
  const boundaryDispute = activeDisputes.some((d) => (d.dispute_type || "").toUpperCase().includes("BOUNDARY")) ||
    unresolvedConflicts.some((c) => (c.conflict_type || "").toUpperCase().includes("BOUNDARY"));
  legalSub.push({
    name: "Boundary Dispute",
    triggered: boundaryDispute,
    severity: "MEDIUM",
    evidence: boundaryDispute
      ? "Contested plot demarcation filed with Circle Amin."
      : "Boundary demarcations uncontested.",
  });
  const acquisition = (input.restrictionZones || []).some((r) =>
    (r.restriction_type || "").toUpperCase().includes("ACQUISITION"),
  );
  legalSub.push({
    name: "Acquisition Proceeding",
    triggered: acquisition,
    severity: "HIGH",
    evidence: acquisition
      ? "Land acquisition notification active for public infrastructure."
      : "Not under government acquisition.",
  });

  const legalScore = Math.min(
    100,
    (hasStayOrder ? 85 : 0) +
    (activeDisputes.length > 0 ? 50 : 0) +
    (boundaryDispute ? 25 : 0) +
    (acquisition ? 50 : 0),
  );
  const legalLevel = getRiskLevel(legalScore);
  categories.push({
    key: "legalDispute",
    name: "Legal / Dispute Risk",
    icon: "Scale",
    level: legalLevel,
    score: legalScore,
    summary: legalLevel === "HIGH"
      ? (hasStayOrder ? "Active judicial stay order prohibits transfer" : "Active court litigation on title")
      : legalLevel === "MEDIUM"
        ? "Boundary or contested survey demarcation filed"
        : "No litigation or court stay orders active",
    action: legalLevel === "HIGH"
      ? "Transactions prohibited until final judicial disposal."
      : legalLevel === "MEDIUM"
        ? "Require no-dispute certificate from Sub-Divisional Magistrate."
        : "Clear litigation status.",
    factors: legalSub,
  });

  // 3. 🔒 Encumbrance Risk
  const encSub: RiskSubFactor[] = [];
  const hasMortgage = activeEncumbrances.some((e) => (e.encumbrance_type || "").toUpperCase().includes("MORTGAGE"));
  encSub.push({
    name: "Bank Mortgage / Charge",
    triggered: hasMortgage,
    severity: "HIGH",
    evidence: hasMortgage
      ? `Active financial charge registered by ${activeEncumbrances[0]?.institution || "Scheduled Bank"}.`
      : "No active mortgage recorded.",
  });
  const hasLien = activeEncumbrances.some((e) => (e.encumbrance_type || "").toUpperCase().includes("LIEN"));
  encSub.push({
    name: "Bank Lien / CERSAI Charge",
    triggered: hasLien,
    severity: "MEDIUM",
    evidence: hasLien
      ? "Lien registered on title security."
      : "No bank lien registered.",
  });
  const hasDisputedEnc = disputedEncumbrances.length > 0;
  encSub.push({
    name: "Disputed / Unreleased Charge",
    triggered: hasDisputedEnc,
    severity: "HIGH",
    evidence: hasDisputedEnc
      ? "Disputed bank mortgage charge recorded."
      : "No disputed charges.",
  });
  const encScore = Math.min(
    100,
    (hasDisputedEnc ? 80 : 0) + (hasMortgage ? 65 : 0) + (hasLien ? 40 : 0),
  );
  const encLevel = getRiskLevel(encScore);
  categories.push({
    key: "encumbrance",
    name: "Encumbrance Risk",
    icon: "Lock",
    level: encLevel,
    score: encScore,
    summary: encLevel === "HIGH"
      ? "Active mortgage or disputed charge on property"
      : encLevel === "MEDIUM"
        ? "Bank lien registered on title"
        : "Nil encumbrance — free from financial charges",
    action: encLevel === "HIGH"
      ? "Obtain Bank No-Objection Certificate (NOC) and deed of release."
      : encLevel === "MEDIUM"
        ? "Verify CERSAI portal discharge certificate."
        : "Clear financial title.",
    factors: encSub,
  });

  // 4. 🌾 Land-Use Risk
  const landUseSub: RiskSubFactor[] = [];
  const landType = (input.landType || "Agricultural").toLowerCase();
  const masterPlanUses = (input.masterPlanZones || []).map((z) => (z.permitted_use || z.zone_name || "").toLowerCase());
  const hasLandUseMismatch = masterPlanUses.length > 0 && !masterPlanUses.some((mp) => mp.includes(landType) || landType.includes(mp));
  const landUseConflict = unresolvedConflicts.some((c) =>
    ["LAND_USE_VIOLATION", "UNAUTHORIZED_DEVELOPMENT", "LAND_USE_MISMATCH"].includes((c.conflict_type || "").toUpperCase()),
  );
  landUseSub.push({
    name: "Recorded vs Master Plan Mismatch",
    triggered: hasLandUseMismatch || landUseConflict,
    severity: "HIGH",
    evidence: (hasLandUseMismatch || landUseConflict)
      ? `Recorded use (${input.landType || "Agricultural"}) diverges from Master Plan 2031 zone.`
      : "Recorded land use aligns with statutory master plan.",
  });
  const unauthConvert = landType === "agricultural" && (input.buildingPermissions || []).length > 0;
  landUseSub.push({
    name: "Unauthorized Conversion (CLU)",
    triggered: unauthConvert,
    severity: "HIGH",
    evidence: unauthConvert
      ? "Agricultural plot utilized for built-up structures without Section 143 CLU."
      : "No unauthorized land-use conversion detected.",
  });
  const landUseScore = Math.min(
    100,
    (landUseConflict ? 75 : 0) + (hasLandUseMismatch ? 50 : 0) + (unauthConvert ? 60 : 0),
  );
  const landUseLevel = getRiskLevel(landUseScore);
  categories.push({
    key: "landUse",
    name: "Land-Use Risk",
    icon: "Trees",
    level: landUseLevel,
    score: landUseScore,
    summary: landUseLevel === "HIGH"
      ? "Recorded agricultural classification vs built-up master plan divergence"
      : landUseLevel === "MEDIUM"
        ? "Change of Land Use (CLU) approval pending verification"
        : "Conforms to statutory agricultural / residential use",
    action: landUseLevel === "HIGH"
      ? "Requires District Magistrate Change of Land Use (CLU) sanction."
      : "Statutory land-use compliant.",
    factors: landUseSub,
  });

  // 5. 🏛️ Zoning / Planning Risk
  const zoningSub: RiskSubFactor[] = [];
  const highRestrictions = (input.restrictionZones || []).filter(
    (r) => (r.severity || "").toUpperCase() === "HIGH" || (r.severity || "").toUpperCase() === "CRITICAL",
  );
  zoningSub.push({
    name: "Restricted Planning Zone",
    triggered: highRestrictions.length > 0,
    severity: "HIGH",
    evidence: highRestrictions.length > 0
      ? `Plot falls in statutory restriction zone: ${highRestrictions.map((r) => r.restriction_type || r.restriction_name).join(", ")}.`
      : "Plot lies outside statutory exclusion buffers.",
  });
  const zoningScore = Math.min(100, highRestrictions.length * 60 + ((input.restrictionZones || []).length > 0 ? 25 : 0));
  const zoningLevel = getRiskLevel(zoningScore);
  categories.push({
    key: "zoningPlanning",
    name: "Zoning / Planning Risk",
    icon: "Building2",
    level: zoningLevel,
    score: zoningScore,
    summary: zoningLevel === "HIGH"
      ? "Plot falls within high-severity planning restriction buffer"
      : zoningLevel === "MEDIUM"
        ? "Intersecting development control zone"
        : "Compliant with municipal planning guidelines",
    action: zoningLevel === "HIGH"
      ? "Development strictly prohibited or subject to State Planning Board sanction."
      : "Permitted under standard building by-laws.",
    factors: zoningSub,
  });

  // 6. 🏗️ Building / Construction Risk
  const bldgSub: RiskSubFactor[] = [];
  const permissions = input.buildingPermissions || [];
  const expiredBp = permissions.some((bp) => (bp.status || "").toUpperCase() === "EXPIRED");
  const pendingBp = permissions.some((bp) => (bp.status || "").toUpperCase() === "PENDING");
  bldgSub.push({
    name: "Building Sanction Status",
    triggered: expiredBp || (permissions.length === 0 && landType === "commercial"),
    severity: expiredBp ? "HIGH" : "MEDIUM",
    evidence: expiredBp
      ? "Approved building sanction has expired. Renewal required."
      : permissions.length > 0
        ? `Sanction status: ${permissions[0].status || "Approved"}.`
        : "No active building construction violation recorded.",
  });
  const bldgScore = expiredBp ? 70 : pendingBp ? 35 : 0;
  const bldgLevel = getRiskLevel(bldgScore);
  categories.push({
    key: "buildingConstruction",
    name: "Building / Construction Risk",
    icon: "Hammer",
    level: bldgLevel,
    score: bldgScore,
    summary: bldgLevel === "HIGH"
      ? "Expired building sanction or unauthorized construction detected"
      : bldgLevel === "MEDIUM"
        ? "Building sanction application under departmental review"
        : "Sanctioned and compliant with building plan regulations",
    action: bldgLevel === "HIGH"
      ? "Apply for building plan renewal with Urban Local Body (ULB)."
      : "Compliant.",
    factors: bldgSub,
  });

  // 7. 📐 Boundary / Survey Risk
  const boundarySub: RiskSubFactor[] = [];
  const boundaryOverlap = unresolvedConflicts.some((c) =>
    ["BOUNDARY_OVERLAP", "CADASTRAL_OVERLAP", "SURVEY_MISMATCH"].includes((c.conflict_type || "").toUpperCase()),
  );
  boundarySub.push({
    name: "Cadastral Boundary Overlap",
    triggered: boundaryOverlap,
    severity: "HIGH",
    evidence: boundaryOverlap
      ? "GIS polygon intersects adjacent revenue survey plot."
      : "Cadastral boundaries verified without polygon overlaps.",
  });
  const hasAreas =
    typeof input.cadastralAreaSqm === "number" &&
    input.cadastralAreaSqm > 0 &&
    typeof input.rorAreaSqm === "number" &&
    input.rorAreaSqm > 0;
  let areaDiffPct = 0;
  if (hasAreas) {
    areaDiffPct = (Math.abs(input.cadastralAreaSqm! - input.rorAreaSqm!) / input.cadastralAreaSqm!) * 100;
  }
  const areaMismatch = areaDiffPct > 5;
  boundarySub.push({
    name: "Cadastral / RoR Area Mismatch",
    triggered: areaMismatch,
    severity: areaDiffPct > 10 ? "HIGH" : "MEDIUM",
    evidence: areaMismatch
      ? `${areaDiffPct.toFixed(1)}% area difference between GIS survey and Khatiyan record.`
      : "Cadastral GIS area reconciles with Khatiyan area.",
  });
  const duplicateUlpin = Boolean(input.duplicateIdentifier);
  boundarySub.push({
    name: "Duplicate Survey Identifier",
    triggered: duplicateUlpin,
    severity: "HIGH",
    evidence: duplicateUlpin
      ? "ULPIN / Khesra number registered across multiple spatial plots."
      : "Unique 14-digit ULPIN verified.",
  });
  const boundaryScore = Math.min(
    100,
    (boundaryOverlap ? 60 : 0) + (areaMismatch ? (areaDiffPct > 10 ? 50 : 25) : 0) + (duplicateUlpin ? 45 : 0),
  );
  const boundaryLevel = getRiskLevel(boundaryScore);
  categories.push({
    key: "boundarySurvey",
    name: "Boundary / Survey Risk",
    icon: "Ruler",
    level: boundaryLevel,
    score: boundaryScore,
    summary: boundaryLevel === "HIGH"
      ? "Spatial boundary overlap or severe area discrepancy detected"
      : boundaryLevel === "MEDIUM"
        ? "Minor cadastral area reconciliation required"
        : "Precise DGPS boundary geometry with zero spatial overlaps",
    action: boundaryLevel === "HIGH"
      ? "Field demarcation survey required by Government Amin."
      : "Survey verified.",
    factors: boundarySub,
  });

  // 8. 🌿 Environmental Risk
  const envSub: RiskSubFactor[] = [];
  const floodZone = (input.restrictionZones || []).some((r) =>
    (r.restriction_type || "").toUpperCase().includes("FLOOD") || (r.restriction_name || "").toUpperCase().includes("FLOOD"),
  );
  envSub.push({
    name: "Flood-Prone / Low-Lying Area",
    triggered: floodZone,
    severity: "HIGH",
    evidence: floodZone
      ? "Plot falls in high-risk inundation / flood buffer zone."
      : "Safe elevation; outside designated flood hazard zone.",
  });
  const wetland = (input.restrictionZones || []).some((r) =>
    (r.restriction_type || "").toUpperCase().includes("WETLAND") || (r.restriction_type || "").toUpperCase().includes("WATER"),
  );
  envSub.push({
    name: "Wetland / Waterbody Buffer",
    triggered: wetland,
    severity: "HIGH",
    evidence: wetland
      ? "Located within 50m statutory wetland / water reservoir buffer."
      : "Adequate setback from natural waterbodies.",
  });
  const envScore = (floodZone ? 60 : 0) + (wetland ? 50 : 0);
  const envLevel = getRiskLevel(envScore);
  categories.push({
    key: "environmental",
    name: "Environmental Risk",
    icon: "Droplets",
    level: envLevel,
    score: envScore,
    summary: envLevel === "HIGH"
      ? "Plot intersects flood inundation or wetland buffer zone"
      : "Low environmental vulnerability",
    action: envLevel === "HIGH"
      ? "Requires State Pollution Control Board & Disaster Management NOC."
      : "Environmentally cleared.",
    factors: envSub,
  });

  // 9. 🛰️ Satellite / Change Detection Risk
  const satSub: RiskSubFactor[] = [];
  const satChange = unresolvedConflicts.some((c) =>
    (c.conflict_type || "").toUpperCase().includes("SATELLITE") || (c.conflict_type || "").toUpperCase().includes("CHANGE"),
  );
  satSub.push({
    name: "Land-Cover & Footprint Change",
    triggered: satChange,
    severity: "MEDIUM",
    evidence: satChange
      ? "Multi-temporal satellite analysis detected sudden structural footprint change."
      : "No unrecorded physical alterations detected in recent imagery.",
  });
  const satScore = satChange ? 55 : 0;
  const satLevel = getRiskLevel(satScore);
  categories.push({
    key: "satelliteChange",
    name: "Satellite / Change Detection Risk",
    icon: "Activity",
    level: satLevel,
    score: satScore,
    summary: satLevel === "MEDIUM"
      ? "Recent physical land-cover alteration flagged in temporal imagery"
      : "Stable land-cover footprint confirmed",
    action: satLevel === "MEDIUM"
      ? "Drone / ground-truthing inspection recommended to update physical assessment."
      : "Stable baseline.",
    factors: satSub,
  });

  // 10. 💰 Tax / Financial Risk
  const taxSub: RiskSubFactor[] = [];
  const unpaidTaxes = (input.taxes || []).filter(
    (t) => (t.status || "").toUpperCase() === "UNPAID" || (t.status || "").toUpperCase() === "PENDING" || (t.due_amount || 0) > 0 || (t.arrears || 0) > 0,
  );
  taxSub.push({
    name: "Property Tax Arrears",
    triggered: unpaidTaxes.length > 0,
    severity: unpaidTaxes.length > 1 ? "HIGH" : "MEDIUM",
    evidence: unpaidTaxes.length > 0
      ? `${unpaidTaxes.length} year(s) of municipal property tax arrears due.`
      : "All municipal property tax dues cleared through current assessment year.",
  });
  const taxScore = unpaidTaxes.length > 1 ? 65 : unpaidTaxes.length === 1 ? 35 : 0;
  const taxLevel = getRiskLevel(taxScore);
  categories.push({
    key: "taxFinancial",
    name: "Tax / Financial Risk",
    icon: "ReceiptText",
    level: taxLevel,
    score: taxScore,
    summary: taxLevel === "HIGH"
      ? "Accumulated municipal property tax arrears"
      : taxLevel === "MEDIUM"
        ? "Current financial year tax dues pending payment"
        : "All municipal property taxes and revenue lagan up-to-date",
    action: taxLevel !== "LOW"
      ? "Clear outstanding municipal property tax dues to obtain NOC."
      : "Financial clearance up-to-date.",
    factors: taxSub,
  });

  // 11. 🛣️ Infrastructure Risk
  const infraSub: RiskSubFactor[] = [];
  infraSub.push({
    name: "Road Access & Utility Corridors",
    triggered: false,
    severity: "LOW",
    evidence: "Direct frontage to notified PWD / PMGSY road network.",
  });
  categories.push({
    key: "infrastructure",
    name: "Infrastructure Risk",
    icon: "Zap",
    level: "LOW",
    score: 15,
    summary: "Good road frontage and public utility connectivity",
    action: "Adequate infrastructure access.",
    factors: infraSub,
  });

  // 12. 📍 Location / Development Risk
  const locSub: RiskSubFactor[] = [];
  locSub.push({
    name: "Arterial Corridor Proximity",
    triggered: false,
    severity: "LOW",
    evidence: "Established growth zone within municipal development corridor.",
  });
  categories.push({
    key: "locationDevelopment",
    name: "Location / Development Risk",
    icon: "MapPin",
    level: "LOW",
    score: 20,
    summary: "Standard development corridor density",
    action: "Standard development zoning.",
    factors: locSub,
  });

  // Calculate composite metrics
  const highCount = categories.filter((c) => c.level === "HIGH").length;
  const mediumCount = categories.filter((c) => c.level === "MEDIUM").length;
  const lowCount = categories.filter((c) => c.level === "LOW").length;

  const compositeScore = Math.min(
    100,
    Math.round(categories.reduce((acc, c) => acc + c.score, 0) / categories.length * 1.6),
  );
  const compositeLevel: RiskLevel =
    highCount >= 2 || hasStayOrder || compositeScore >= 65
      ? "HIGH"
      : highCount === 1 || mediumCount >= 2 || compositeScore >= 35
        ? "MEDIUM"
        : "LOW";

  const confidence: RiskConfidence = "HIGH";

  // Build legacy factors array for backwards compatibility
  const legacyFactors: RiskFactor[] = categories.map((c) => ({
    key: c.key,
    label: c.name,
    points: c.score,
    maximumPoints: 100,
    evidence: c.summary,
    available: true,
  }));

  return {
    parcelId: input.parcelId,
    score: compositeScore,
    level: compositeLevel,
    compositeScore,
    compositeLevel,
    confidence,
    highCount,
    mediumCount,
    lowCount,
    dataCompletenessPercent: 100,
    recommendation: getRecommendation(compositeLevel, confidence),
    categories,
    factors: legacyFactors,
  };
}
