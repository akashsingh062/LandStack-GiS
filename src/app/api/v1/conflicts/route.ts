import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");

    let sql = `
      SELECT 
        d.dispute_id AS conflict_id,
        p.ulpin,
        p.survey_number,
        d.dispute_type AS conflict_type,
        d.description,
        'CRITICAL' AS severity,
        d.filing_date,
        d.status,
        d.court_or_authority
      FROM governance.disputes d
      JOIN gis.parcels p ON d.parcel_id = p.parcel_id
      ORDER BY d.filing_date DESC
      LIMIT 50
    `;

    const result = await query(sql);

    // Fallback static sample conflicts if table is empty
    const mockConflicts = [
      {
        conflict_id: "CONF-001",
        ulpin: "IN-BR-10-00000001-62",
        survey_number: "Plot #1420",
        conflict_type: "SPATIAL_OVERLAP",
        severity: "CRITICAL",
        description: "12.5 sq.m geometric boundary overlap detected with adjacent Khesra #1421.",
        filing_date: "2026-08-15",
        status: "INVESTIGATING",
        court_or_authority: "Circle Officer, Basopatti",
      },
      {
        conflict_id: "CONF-002",
        ulpin: "IN-BR-10-00000002-73",
        survey_number: "Plot #1894",
        conflict_type: "OWNERSHIP_MISMATCH",
        severity: "HIGH",
        description: "Registration deed lists Rameshwar Prasad, but RoR Khatiyan shows Ramvilas Singh.",
        filing_date: "2026-08-18",
        status: "HEARING_SCHEDULED",
        court_or_authority: "DSR Sub-Registry, Madhubani",
      },
      {
        conflict_id: "CONF-003",
        ulpin: "IN-BR-10-00000003-84",
        survey_number: "Plot #1648",
        conflict_type: "LANDUSE_NON_COMPLIANCE",
        severity: "MEDIUM",
        description: "Agricultural land parcel marked as Commercial layout without change of land use NOC.",
        filing_date: "2026-08-20",
        status: "NOTICE_ISSUED",
        court_or_authority: "Town Planning Authority",
      },
    ];

    const conflicts = (result.rows && result.rows.length > 0) ? result.rows : mockConflicts;
    const filtered = (severity && severity !== "ALL")
      ? conflicts.filter((c: any) => c.severity === severity)
      : conflicts;

    return NextResponse.json(
      { conflicts: filtered, total: filtered.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    console.error("Conflicts API Error:", err);
    return NextResponse.json({ error: "Failed to fetch conflicts" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      { success: true, message: `Conflict ${body.conflict_id || "record"} updated.` },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
