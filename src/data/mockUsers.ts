/**
 * Mock User Database
 * ──────────────────
 * Simulates a backend relational database with two tables:
 *   • users        — registered account records
 *   • otp_sessions — short-lived one-time-password tokens
 *
 * MIGRATION PATH
 * When you connect a real backend, delete this file entirely.
 * All callers live in src/lib/authApi.ts, so no UI files need to change.
 *
 * Naming conventions match typical SQL columns (snake_case → camelCase mapped
 * by an ORM) so the shape is immediately recognisable if you later use Prisma,
 * Drizzle, or a plain Postgres client.
 */

// ── Schema ─────────────────────────────────────────────────────────────────────

/** Mirrors a row in the `users` table */
export interface User {
  id: string;              // primary key  — e.g. "usr_001"
  phoneNumber: string;     // unique index — Iranian mobile: 09XXXXXXXXX (11 digits)
  firstName: string;       // نام
  lastName: string;        // نام خانوادگی
  province: string;        // استان (FK → reference table in a real DB)
  city: string;            // شهر
  address: string;         // آدرس تفصیلی
  postalCode: string;      // کد پستی — exactly 10 digits
  createdAt: string;       // ISO-8601 timestamp
  // Optional profile fields — nullable columns in the real DB
  shopName?: string;       // نام فروشگاه
  birthDate?: string;      // تاریخ تولد — ISO-8601 date (e.g. "1990-05-12")
  profileImage?: string;   // تصویر پروفایل — URL or relative path
}

/** Mirrors a row in the `otp_sessions` table */
interface OtpSession {
  code: string;
  expiresAt: number; // Unix epoch ms
}

// ── Seed data ──────────────────────────────────────────────────────────────────

/**
 * Pre-seeded accounts — these phone numbers will be recognised as existing
 * users during the login flow and sent straight to /dashboard.
 *
 * TEST CASES
 *   • 09121234567  →  existing user  →  OTP ✓  →  /dashboard
 *   • 09351112233  →  existing user  →  OTP ✓  →  /dashboard
 *   • any other 09XXXXXXXXX  →  new user  →  OTP ✓  →  /signup
 */
export const usersTable: User[] = [
  {
    id: 'usr_001',
    phoneNumber: '09121234567',
    firstName: 'علی',
    lastName: 'محمدی',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان ولیعصر، پلاک ۱۲۴، واحد ۳',
    postalCode: '1411873563',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'usr_002',
    phoneNumber: '09351112233',
    firstName: 'فاطمه',
    lastName: 'حسینی',
    province: 'اصفهان',
    city: 'اصفهان',
    address: 'خیابان چهارباغ، کوچه رضوی، پلاک ۷',
    postalCode: '8174793651',
    createdAt: '2024-02-20T12:30:00.000Z',
  },
];

// ── OTP sessions table (in-memory; resets on page reload) ─────────────────────

const otpSessionsTable = new Map<string, OtpSession>();

/** Sessions expire after 2 minutes, matching real SMS OTP conventions */
const OTP_TTL_MS = 2 * 60 * 1000;

// ── Query functions ────────────────────────────────────────────────────────────
// These mirror the SQL queries an ORM would generate.

/** SELECT * FROM users WHERE phone_number = $1 LIMIT 1 */
export function dbFindUserByPhone(phoneNumber: string): User | null {
  return usersTable.find((u) => u.phoneNumber === phoneNumber) ?? null;
}

/**
 * INSERT INTO otp_sessions (phone_number, code, expires_at) VALUES ($1, $2, $3)
 *   ON CONFLICT (phone_number) DO UPDATE SET code = $2, expires_at = $3
 *
 * Returns the generated code so authApi.ts can surface it in the dev alert.
 *
 * PRODUCTION: replace the fixed string with a secure random generator, e.g.:
 *   const code = crypto.randomInt(1000, 9999).toString();
 */
export function dbCreateOtpSession(phoneNumber: string): string {
  const code = '1234'; // fixed mock code — always accepted in dev
  otpSessionsTable.set(phoneNumber, { code, expiresAt: Date.now() + OTP_TTL_MS });
  return code;
}

/**
 * SELECT 1 FROM otp_sessions
 *   WHERE phone_number = $1 AND code = $2 AND expires_at > extract(epoch FROM now()) * 1000
 */
export function dbVerifyOtpSession(phoneNumber: string, code: string): boolean {
  const session = otpSessionsTable.get(phoneNumber);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    otpSessionsTable.delete(phoneNumber);
    return false;
  }
  return session.code === code.trim();
}

/** DELETE FROM otp_sessions WHERE phone_number = $1  (one-time use enforcement) */
export function dbConsumeOtpSession(phoneNumber: string): void {
  otpSessionsTable.delete(phoneNumber);
}

/** INSERT INTO users (...) VALUES (...) RETURNING * */
export function dbCreateUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const newUser: User = {
    id: `usr_${String(usersTable.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    ...data,
  };
  usersTable.push(newUser);
  return newUser;
}
