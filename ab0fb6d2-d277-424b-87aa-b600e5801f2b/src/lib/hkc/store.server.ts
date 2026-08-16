/** Server-only data layer: Supabase Postgres, password hashing, sessions, seeding. */
import postgres from "postgres";

export const SESSION_COOKIE = "hkc_session";
const SESSION_DAYS = 30;
const encoder = new TextEncoder();

type Client = ReturnType<typeof postgres>;
let client: Client | undefined;

function sql(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    // Supabase transaction pooler does not support prepared statements.
    client = postgres(url, { idle_timeout: 20, max: 1, prepare: false, ssl: "require" });
  }
  return client;
}

/** SQLite style `?` placeholders to Postgres `$1, $2, ...`. */
function toPositional(text: string): string {
  let index = 0;
  return text.replace(/\?/g, () => `$${(index += 1)}`);
}

class Statement {
  constructor(
    private readonly text: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...params: unknown[]): Statement {
    return new Statement(this.text, params);
  }

  private exec(): Promise<unknown[]> {
    return sql().unsafe(toPositional(this.text), this.params as never[]) as unknown as Promise<unknown[]>;
  }

  async first<T>(): Promise<T | null> {
    const rows = await this.exec();
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const rows = await this.exec();
    return { results: rows as T[] };
  }

  async run(): Promise<void> {
    await this.exec();
  }
}

export function db() {
  return { prepare: (text: string) => new Statement(text) };
}

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function newSalt(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { hash: "SHA-256", iterations: 100_000, name: "PBKDF2", salt: encoder.encode(salt) },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function json(data: unknown, init?: { headers?: Record<string, string>; status?: number }) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", ...(init?.headers ?? {}) },
    status: init?.status ?? 200,
  });
}

export function fail(message: string, status = 400) {
  return json({ error: message, ok: false }, { status });
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function sessionCookie(id: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSeconds}`;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface CleanerRow {
  user_id: string;
  tier: number;
  headline: string | null;
  bio: string | null;
  areas: string | null;
  years_experience: number;
  rating_sum: number;
  rating_count: number;
  jobs_completed: number;
  earnings_released_cents: number;
  status: string;
  id_verified: number;
  background_check: number;
  payment_on_file: number;
  avatar: string | null;
  hourly_rate_cents: number;
  plan: string;
  accepting: number;
  specialties: string;
  fees_owed_cents: number;
}

export async function createSession(userId: string): Promise<string> {
  const id = uid("sess");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await db()
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(id, userId, expires)
    .run();
  return id;
}

export async function currentUser(request: Request): Promise<UserRow | null> {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return null;
  return db()
    .prepare(
      "SELECT u.id, u.email, u.name, u.phone, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > now()",
    )
    .bind(sid)
    .first<UserRow>();
}

export async function cleanerProfile(userId: string): Promise<CleanerRow | null> {
  return db().prepare("SELECT * FROM cleaners WHERE user_id = ?").bind(userId).first<CleanerRow>();
}

const SEED = [
  { areas: "Silver Lake, Echo Park, Los Feliz, Atwater", avatar: "/assets/people/cleaner-1.jpg", count: 118, email: "marisol@homekeyclean.com", headline: "Deep cleans and move outs, nine years in", jobs: 132, name: "Marisol Reyes", plan: "pro", rate: 5200, specialties: '["deep","moveout","recurring"]', sum: 578, years: 9 },
  { areas: "Long Beach, Torrance, San Pedro", avatar: "/assets/people/cleaner-2.jpg", count: 41, email: "danielle@homekeyclean.com", headline: "Weekly upkeep for busy households", jobs: 48, name: "Danielle Carter", plan: "listed", rate: 4200, specialties: '["recurring","pets","laundry"]', sum: 189, years: 4 },
  { areas: "Irvine, Costa Mesa, Tustin", avatar: "/assets/people/cleaner-3.jpg", count: 9, email: "kenji@homekeyclean.com", headline: "Detail focused, offices and homes", jobs: 11, name: "Kenji Watanabe", plan: "listed", rate: 3600, specialties: '["commercial","organizing"]', sum: 38, years: 2 },
  { areas: "Pasadena, Glendale, Burbank", avatar: "/assets/people/cleaner-4.jpg", count: 76, email: "aurora@homekeyclean.com", headline: "Eco friendly products, families welcome", jobs: 84, name: "Aurora Villanueva", plan: "pro", rate: 4800, specialties: '["ecofriendly","pets","recurring"]', sum: 372, years: 12 },
  { areas: "Santa Monica, Culver City, Mar Vista", avatar: "/assets/people/cleaner-5.jpg", count: 6, email: "diego@homekeyclean.com", headline: "Fast, thorough, weekends available", jobs: 7, name: "Diego Marquez", plan: "listed", rate: 3200, specialties: '["deep","moveout"]', sum: 27, years: 2 },
  { areas: "Newport Beach, Laguna Beach, Mission Viejo", avatar: "/assets/people/cleaner-6.jpg", count: 52, email: "irena@homekeyclean.com", headline: "Twenty years in high end residential", jobs: 61, name: "Irena Kowalski", plan: "pro", rate: 6500, specialties: '["deep","organizing","recurring"]', sum: 253, years: 20 },
];

/** Idempotent demo roster. Re-runs until every seeded cleaner matches the
 *  referral model, then costs one cheap count query per request. */
export async function ensureSeed(): Promise<void> {
  const done = await db()
    .prepare("SELECT COUNT(*) AS n FROM cleaners WHERE plan = 'pro'")
    .first<{ n: number }>();
  if (Number(done?.n ?? 0) >= 3) return;

  const salt = newSalt();
  const hash = await hashPassword("demo1234", salt);

  for (const person of SEED) {
    await db()
      .prepare(
        "INSERT INTO users (id, email, name, role, password_hash, password_salt) VALUES (?, ?, ?, 'cleaner', ?, ?) ON CONFLICT (email) DO NOTHING",
      )
      .bind(uid("usr"), person.email, person.name, hash, salt)
      .run();
    const row = await db()
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(person.email)
      .first<{ id: string }>();
    if (!row) continue;
    await db()
      .prepare("INSERT INTO cleaners (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING")
      .bind(row.id)
      .run();
    await db()
      .prepare(
        `UPDATE cleaners SET headline = ?, areas = ?, years_experience = ?, rating_sum = ?,
          rating_count = ?, jobs_completed = ?, status = 'active', id_verified = 1,
          background_check = 1, payment_on_file = 1, avatar = ?, hourly_rate_cents = ?,
          plan = ?, accepting = 1, specialties = ? WHERE user_id = ?`,
      )
      .bind(
        person.headline, person.areas, person.years, person.sum, person.count, person.jobs,
        person.avatar, person.rate, person.plan, person.specialties, row.id,
      )
      .run();
  }
}
