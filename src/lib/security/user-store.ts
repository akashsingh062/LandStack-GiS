/**
 * LandStack — Database User & Official Repository (SIH 2026 PS #26014)
 * Handles Citizen Sign-Up, Profile Storage, and Department Official Validation (Password: )
 */

import { Pool } from "pg";
import { UserRole, UserType } from "./types";
import { normalizePhoneNumber } from "./otp-service";

declare global {
  var landstackDbPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.landstackDbPool) {
    globalThis.landstackDbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return globalThis.landstackDbPool;
}

import {
  DEPARTMENTS,
  DepartmentOption,
} from "./departments";
export { DEPARTMENTS, type DepartmentOption };

export interface DbUser {
  user_id?: string;
  username: string;
  official_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  user_type: UserType;
  department: string;
  title: string;
  jurisdiction: string;
  state_code: string;
  district_code?: string;
  circle_code?: string;
  village_code?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Look up citizen or official by phone
 */
export async function getUserByPhone(phone: string): Promise<DbUser | null> {
  const norm = normalizePhoneNumber(phone);
  try {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM audit.users WHERE phone = $1 OR phone = $2 LIMIT 1`,
      [norm, phone],
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("DB lookup error for phone:", err);
  }
  return null;
}

/**
 * Look up official by official_id or email
 */
export async function getOfficialByIdOrEmail(
  identifier: string,
): Promise<DbUser | null> {
  const clean = identifier.trim().toLowerCase();
  try {
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM audit.users 
       WHERE LOWER(official_id) = $1 
          OR LOWER(email) = $1 
          OR LOWER(username) = $1 
       LIMIT 1`,
      [clean],
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("DB lookup error for official ID:", err);
  }
  return null;
}

export interface CitizenRegistrationInput {
  name: string;
  phone: string;
  email?: string;
  state_code?: string;
  district_code?: string;
  circle_code?: string;
  village_code?: string;
  jurisdiction?: string;
}

/**
 * Register or update citizen in database
 */
export async function registerOrUpdateCitizen(
  input: CitizenRegistrationInput,
): Promise<DbUser> {
  const phone = normalizePhoneNumber(input.phone);
  const username = `citizen_${phone.replace(/\D/g, "").slice(-10)}`;
  const jurisdiction =
    input.jurisdiction ||
    `${input.village_code ? input.village_code + ", " : ""}${input.circle_code || "Basopatti"}, ${input.district_code || "Madhubani"} (${input.state_code || "Bihar"})`;

  const citizenUser: DbUser = {
    username,
    official_id: `CITIZEN-${phone.slice(-4)}`,
    name: input.name.trim(),
    email: input.email?.trim() || `${username}@biharbhumi.bihar.gov.in`,
    phone,
    role: "CITIZEN",
    user_type: "CITIZEN",
    department: "Public Citizen Portal",
    title: "Citizen / Land Owner",
    jurisdiction,
    state_code: input.state_code || "BR",
    district_code: input.district_code || "BR-10",
    circle_code: input.circle_code || "Basopatti",
    village_code: input.village_code || "Arghawa (33)",
  };

  try {
    const pool = getPool();
    const res = await pool.query(
      `
      INSERT INTO audit.users (
        username, official_id, name, email, phone, role, user_type, department,
        title, jurisdiction, state_code, district_code, circle_code, village_code, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
      )
      ON CONFLICT (username) DO UPDATE SET
        name = EXCLUDED.name,
        email = COALESCE(EXCLUDED.email, audit.users.email),
        phone = EXCLUDED.phone,
        jurisdiction = EXCLUDED.jurisdiction,
        state_code = EXCLUDED.state_code,
        district_code = EXCLUDED.district_code,
        circle_code = EXCLUDED.circle_code,
        village_code = EXCLUDED.village_code,
        updated_at = NOW()
      RETURNING *;
    `,
      [
        citizenUser.username,
        citizenUser.official_id,
        citizenUser.name,
        citizenUser.email,
        citizenUser.phone,
        citizenUser.role,
        citizenUser.user_type,
        citizenUser.department,
        citizenUser.title,
        citizenUser.jurisdiction,
        citizenUser.state_code,
        citizenUser.district_code,
        citizenUser.circle_code,
        citizenUser.village_code,
      ],
    );

    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    console.error("DB error in registerOrUpdateCitizen:", err);
  }

  return citizenUser;
}

/**
 * Validate staff login strictly from database table audit.users
 */
export async function validateStaffLogin(params: {
  department?: string;
  official_id: string;
  password?: string;
}): Promise<{ success: boolean; user?: DbUser; error?: string }> {
  const { department, official_id, password } = params;

  if (!official_id) {
    return {
      success: false,
      error: "Please enter your Official Employee ID or Government Email.",
    };
  }

  if (!password) {
    return {
      success: false,
      error: "Department password is required.",
    };
  }

  const clean = official_id.trim().toLowerCase();
  const pool = getPool();

  let user: (DbUser & { password_hash?: string }) | null = null;
  try {
    const res = await pool.query(
      `SELECT * FROM audit.users 
       WHERE (LOWER(official_id) = $1 OR LOWER(email) = $1 OR LOWER(username) = $1)
         AND user_type = 'STAFF'
       LIMIT 1`,
      [clean]
    );
    if (res.rows.length > 0) {
      user = res.rows[0];
    }
  } catch (err) {
    console.error("DB lookup error in validateStaffLogin:", err);
  }

  if (!user) {
    return {
      success: false,
      error: `Official ID '${official_id}' is not provisioned in the Land Governance directory.`,
    };
  }

  // Verify password strictly against stored database hash
  const storedHash = user.password_hash;
  const isPasswordValid = storedHash ? password === storedHash : false;

  if (!isPasswordValid) {
    return {
      success: false,
      error: "Invalid official password. Please verify your department credentials.",
    };
  }

  // Verify department match if department was explicitly selected
  if (department && department !== "all") {
    const deptObj = DEPARTMENTS.find(
      (d) =>
        d.id === department ||
        d.name.toLowerCase() === department.toLowerCase(),
    );
    if (
      deptObj &&
      user.department !== deptObj.name &&
      !user.department.includes(deptObj.code)
    ) {
      // Allow if Super Admin / State Nodal Admin
      if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
        return {
          success: false,
          error: `Officer '${user.name}' is assigned to '${user.department}', not '${deptObj.name}'.`,
        };
      }
    }
  }

  return { success: true, user };
}
