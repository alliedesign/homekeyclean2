/** HomeKey Clean, a California domestic referral agency. Safe on client and server. */

export type Standing = "new" | "established" | "top";
export type ServiceType = "residential" | "commercial";
export type PlanId = "listed" | "pro";

/* ---------- what cleaners charge ---------- */
/* Cleaners set their own hourly rate. These bounds are input validation only,
   not a rate the agency sets. */
export const RATE_MIN_CENTS = 2500;
export const RATE_MAX_CENTS = 15000;
export const MIN_HOURS = 2;
export const MAX_HOURS = 10;

/* ---------- what cleaners pay us ---------- */
export interface Plan {
  id: PlanId;
  name: string;
  monthlyCents: number;
  leadFeeCents: number;
  blurb: string;
  perks: string[];
}

export const PLANS: Plan[] = [
  {
    blurb: "Pay only when a referral turns into work.",
    id: "listed",
    leadFeeCents: 1500,
    monthlyCents: 0,
    name: "Listed",
    perks: [
      "Your profile in the directory",
      "Unlimited referral requests",
      "$15 only when you accept a job",
      "Cancel any time",
    ],
  },
  {
    blurb: "One flat monthly fee, nothing per job.",
    id: "pro",
    leadFeeCents: 0,
    monthlyCents: 7900,
    name: "Pro",
    perks: [
      "Everything in Listed",
      "No per referral fees at all",
      "Priority placement in search",
      "Featured badge on your profile",
    ],
  },
];

export function planFor(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function leadFeeFor(planId: string): number {
  return planFor(planId).leadFeeCents;
}

/* ---------- reputation, never price ---------- */
export const STANDING_COPY: Record<Standing, { label: string; blurb: string }> = {
  established: { blurb: "Ten or more finished jobs with a solid rating.", label: "Established" },
  new: { blurb: "Newly vetted. Identity and background checked all the same.", label: "Newly listed" },
  top: { blurb: "Twenty five or more jobs at a 4.8 average or better.", label: "Top rated" },
};

export function standingFor(avg: number, jobs: number): Standing {
  if (jobs >= 25 && avg >= 4.8) return "top";
  if (jobs >= 10) return "established";
  return "new";
}

export function ratingAverage(sum: number, count: number): number {
  return count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
}

/* ---------- job shape ---------- */
export interface Addon {
  id: string;
  label: string;
  minutes: number;
}

export const ADDONS: Addon[] = [
  { id: "fridge", label: "Inside the fridge", minutes: 30 },
  { id: "oven", label: "Inside the oven", minutes: 30 },
  { id: "windows", label: "Interior windows", minutes: 45 },
  { id: "laundry", label: "Laundry and fold", minutes: 45 },
  { id: "cabinets", label: "Inside cabinets", minutes: 30 },
  { id: "garage", label: "Garage sweep", minutes: 30 },
];

export function addonMinutes(ids: string[]): number {
  return ADDONS.filter((a) => ids.includes(a.id)).reduce((n, a) => n + a.minutes, 0);
}

export const FREQUENCIES = [
  { id: "once", label: "One time" },
  { id: "weekly", label: "Every week" },
  { id: "biweekly", label: "Every two weeks" },
  { id: "monthly", label: "Every month" },
];

export const SPECIALTIES = [
  { id: "deep", label: "Deep cleaning" },
  { id: "moveout", label: "Move in and move out" },
  { id: "recurring", label: "Recurring upkeep" },
  { id: "commercial", label: "Offices and commercial" },
  { id: "ecofriendly", label: "Eco friendly products" },
  { id: "pets", label: "Pet friendly homes" },
  { id: "laundry", label: "Laundry and ironing" },
  { id: "organizing", label: "Organising" },
];

export function specialtyLabel(id: string): string {
  return SPECIALTIES.find((s) => s.id === id)?.label ?? id;
}

/* ---------- coverage ---------- */
export const COVERAGE: { county: string; cities: string[] }[] = [
  {
    cities: ["Los Angeles", "Santa Monica", "Culver City", "Pasadena", "Glendale", "Burbank", "Long Beach", "Torrance", "Beverly Hills", "West Hollywood", "Inglewood", "El Segundo", "Manhattan Beach", "Redondo Beach", "Studio City", "Sherman Oaks"],
    county: "Los Angeles County",
  },
  {
    cities: ["Irvine", "Costa Mesa", "Newport Beach", "Huntington Beach", "Anaheim", "Santa Ana", "Tustin", "Orange", "Fullerton", "Laguna Beach", "Mission Viejo", "Yorba Linda", "Brea", "Seal Beach"],
    county: "Orange County",
  },
];

export const ALL_CITIES = COVERAGE.flatMap((c) => c.cities).sort((a, b) => a.localeCompare(b));

export function countyForCity(city: string): string | null {
  for (const group of COVERAGE) {
    if (group.cities.includes(city)) return group.county;
  }
  return null;
}

/* ---------- formatting ---------- */
export function money(cents: number): string {
  const value = cents / 100;
  return value % 1 === 0 ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`;
}

export function estimate(rateCents: number, hours: number): number {
  return Math.round(rateCents * hours);
}

export function totalHours(baseHours: number, addonIds: string[]): number {
  return Math.round((baseHours + addonMinutes(addonIds) / 60) * 2) / 2;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    day: "numeric", hour: "numeric", minute: "2-digit", month: "short", weekday: "short",
  });
}

export function hoursLabel(hours: number): string {
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export const THEME_COLOR = "#f6f8f5";

/** The disclosure Civil Code 1812.5095 requires us to give both sides in writing. */
export const DISCLOSURE_CLIENT =
  "HomeKey Clean is a referral agency, not an employer and not a cleaning company. The cleaner you hire is not our employee. You pay the cleaner directly at the rate they set. Depending on how the work is arranged, you may have obligations as a household employer, including payroll taxes and workers compensation. We do not direct or control the work.";

export const DISCLOSURE_CLEANER =
  "HomeKey Clean refers clients to you. We are not your employer. You set your own rate, choose which requests to accept, keep your own clients, use your own supplies, and work under your own name. You are free to take referrals from other agencies at the same time.";
