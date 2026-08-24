/**
 * LandStack — Database User Seeding & Schema Sync (SIH 2026 PS #26014)
 * Synchronizes audit.users table with staff accounts (password: sih@2026) and initial citizen accounts
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_STAFF_PASSWORD = "sih@2026";

const OFFICIALS = [
  {
    username: "rev_vikram",
    official_id: "REV-001",
    name: "Vikram Singh",
    email: "co.basopatti@bihar.gov.in",
    phone: "+919431011111",
    role: "REVENUE_OFFICER",
    user_type: "STAFF",
    department: "Revenue & Land Records",
    title: "Revenue Circle Officer (CO)",
    jurisdiction: "Basopatti Circle, Madhubani",
    state_code: "BR",
    district_code: "BR-10",
    circle_code: "Basopatti",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "reg_priya",
    official_id: "REG-001",
    name: "Priya Sharma",
    email: "subreg.madhubani@bihar.gov.in",
    phone: "+919431033333",
    role: "REGISTRATION_OFFICER",
    user_type: "STAFF",
    department: "Registration & Stamps",
    title: "Sub-Registrar (DSR)",
    jurisdiction: "Madhubani Registration District",
    state_code: "BR",
    district_code: "BR-10",
    circle_code: "ALL",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "plan_anand",
    official_id: "PLAN-001",
    name: "Anand Verma",
    email: "tpo.madhubani@bihar.gov.in",
    phone: "+919431044444",
    role: "PLANNING_OFFICER",
    user_type: "STAFF",
    department: "Urban Planning & Housing",
    title: "Town Planning Officer",
    jurisdiction: "Madhubani Planning Area",
    state_code: "BR",
    district_code: "BR-10",
    circle_code: "ALL",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "admin_rajeshwar",
    official_id: "ADMIN-001",
    name: "Rajeshwar Jha",
    email: "nodal.landstack@bihar.gov.in",
    phone: "+919431000000",
    role: "ADMIN",
    user_type: "STAFF",
    department: "Revenue & Land Reforms Dept",
    title: "State Nodal IT Administrator",
    jurisdiction: "State of Bihar (State-wide)",
    state_code: "BR",
    district_code: "ALL",
    circle_code: "ALL",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "super_sanjay",
    official_id: "SUPER-001",
    name: "Dr. Sanjay Kumar, IAS",
    email: "sec.revenue@bihar.gov.in",
    phone: "+919431099999",
    role: "SUPER_ADMIN",
    user_type: "STAFF",
    department: "Apex State Land Governance Directorate",
    title: "Principal Secretary & State Authority",
    jurisdiction: "State of Bihar (Apex Authority)",
    state_code: "BR",
    district_code: "ALL",
    circle_code: "ALL",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "tax_sunita",
    official_id: "TAX-001",
    name: "Sunita Rao",
    email: "eo.basopatti@bihar.gov.in",
    phone: "+919431055555",
    role: "TAX_OFFICER",
    user_type: "STAFF",
    department: "Municipal Property Tax",
    title: "Executive Officer (Nagar Panchayat)",
    jurisdiction: "Nagar Panchayat Basopatti",
    state_code: "BR",
    district_code: "BR-10",
    circle_code: "Basopatti",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
  {
    username: "audit_meenakshi",
    official_id: "AUDIT-001",
    name: "Meenakshi Sundaram",
    email: "auditor.vigilance@cag.gov.in",
    phone: "+919431022222",
    role: "AUDITOR",
    user_type: "STAFF",
    department: "Audit & Vigilance Directorate",
    title: "Principal Auditor (C&AG / Vigilance)",
    jurisdiction: "Union of India (National Scope)",
    state_code: "ALL",
    district_code: "ALL",
    circle_code: "ALL",
    password_hash: DEFAULT_STAFF_PASSWORD,
  },
];

const INITIAL_CITIZENS = [
  {
    username: "citizen_ramesh",
    official_id: "CITIZEN-001",
    name: "Ramesh Kumar",
    email: "ramesh.kumar@biharbhumi.bihar.gov.in",
    phone: "+919876543210",
    role: "CITIZEN",
    user_type: "CITIZEN",
    department: "Public Citizen Portal",
    title: "Citizen / Land Owner",
    jurisdiction: "Basopatti, Madhubani (Bihar)",
    state_code: "BR",
    district_code: "BR-10",
    circle_code: "Basopatti",
    village_code: "Arghawa (33)",
    password_hash: "",
  },
];

async function seedDatabase() {
  console.log("Connecting to Supabase Postgres database...");
  const client = await pool.connect();

  try {
    console.log("Applying column alterations to audit.users...");
    await client.query(`
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS official_id VARCHAR(50);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'CITIZEN';
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS title VARCHAR(150);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(255);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS district_code VARCHAR(50);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS circle_code VARCHAR(50);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS village_code VARCHAR(50);
      ALTER TABLE audit.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      CREATE INDEX IF NOT EXISTS users_phone_idx ON audit.users (phone);
      CREATE INDEX IF NOT EXISTS users_official_id_idx ON audit.users (official_id);
    `);

    console.log("Upserting official accounts into audit.users with common password 'sih@2026'...");
    for (const off of OFFICIALS) {
      await client.query(
        `
        INSERT INTO audit.users (
          username, official_id, name, email, phone, role, user_type, department,
          title, jurisdiction, state_code, district_code, circle_code, password_hash, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        )
        ON CONFLICT (username) DO UPDATE SET
          official_id = EXCLUDED.official_id,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          user_type = EXCLUDED.user_type,
          department = EXCLUDED.department,
          title = EXCLUDED.title,
          jurisdiction = EXCLUDED.jurisdiction,
          state_code = EXCLUDED.state_code,
          district_code = EXCLUDED.district_code,
          circle_code = EXCLUDED.circle_code,
          password_hash = EXCLUDED.password_hash,
          updated_at = NOW();
      `,
        [
          off.username,
          off.official_id,
          off.name,
          off.email,
          off.phone,
          off.role,
          off.user_type,
          off.department,
          off.title,
          off.jurisdiction,
          off.state_code,
          off.district_code,
          off.circle_code,
          off.password_hash,
        ]
      );
      console.log(`  ✓ Seeded Official: ${off.official_id} - ${off.name} [${off.department}]`);
    }

    console.log("Upserting default citizen accounts into audit.users...");
    for (const cit of INITIAL_CITIZENS) {
      await client.query(
        `
        INSERT INTO audit.users (
          username, official_id, name, email, phone, role, user_type, department,
          title, jurisdiction, state_code, district_code, circle_code, village_code, password_hash, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
        )
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          user_type = EXCLUDED.user_type,
          department = EXCLUDED.department,
          title = EXCLUDED.title,
          jurisdiction = EXCLUDED.jurisdiction,
          state_code = EXCLUDED.state_code,
          district_code = EXCLUDED.district_code,
          circle_code = EXCLUDED.circle_code,
          village_code = EXCLUDED.village_code,
          updated_at = NOW();
      `,
        [
          cit.username,
          cit.official_id,
          cit.name,
          cit.email,
          cit.phone,
          cit.role,
          cit.user_type,
          cit.department,
          cit.title,
          cit.jurisdiction,
          cit.state_code,
          cit.district_code,
          cit.circle_code,
          cit.village_code,
          cit.password_hash,
        ]
      );
      console.log(`  ✓ Seeded Citizen: ${cit.name} [${cit.phone}]`);
    }

    console.log("\nDatabase seeding completed successfully!");
  } catch (err) {
    console.error("Database seeding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
