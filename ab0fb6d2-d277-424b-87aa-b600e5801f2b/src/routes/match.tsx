import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SiteFooter, SiteNav, apiGet } from "@/components/hkc/chrome";
import { EmptyState, Field, Icon, Notice, Stars, inputClass } from "@/components/hkc/ui";
import {
  MIN_HOURS, SPECIALTIES, estimate, money, ratingAverage, specialtyLabel,
} from "@/lib/hkc/domain";

export const Route = createFileRoute("/match")({
  component: MatchMe,
  head: () => ({
    meta: [
      { title: "Match me with a cleaner | HomeKey Clean" },
      { content: "Answer four questions and we'll show you three independent cleaners who serve your ZIP, with a reason for each.", name: "description" },
    ],
  }),
});

interface Match {
  user_id: string; name: string; headline: string | null; areas: string | null;
  years_experience: number; rating_sum: number; rating_count: number; jobs_completed: number;
  avatar: string | null; hourly_rate_cents: number; plan: string; specialties: string;
  id_verified: number; background_check: number; miles: string | number;
}

const SIZES = [
  { hours: 2.5, id: "studio", label: "Studio or 1 bed" },
  { hours: 3, id: "2bed", label: "2 bed" },
  { hours: 4, id: "3bed", label: "3 bed" },
  { hours: 5.5, id: "4bed", label: "4 bed or larger" },
];

/** Why this person, in one line. The reason is what makes a match trustworthy. */
function reasonFor(m: Match, index: number, specialty: string): string {
  const miles = Number(m.miles);
  if (index === 0 && Number.isFinite(miles)) {
    return `Closest to you — about ${miles} miles away`;
  }
  if (specialty && m.specialties.includes(`"${specialty}"`)) {
    return `Lists ${specialtyLabel(specialty).toLowerCase()} as a speciality`;
  }
  if (m.jobs_completed >= 25) return `${m.jobs_completed} jobs completed through HomeKey Clean`;
  if (m.years_experience >= 10) return `${m.years_experience} years cleaning professionally`;
  return "Taking new work in your area right now";
}

function MatchMe() {
  const [zip, setZip] = useState("");
  const [size, setSize] = useState(SIZES[1]);
  const [specialty, setSpecialty] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMatches(null);
    try {
      const d = await apiGet<{ matches: Match[] }>(
        `match&zip=${encodeURIComponent(zip)}&specialty=${encodeURIComponent(specialty)}`,
      );
      setMatches(d.matches);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  }

  const rates = matches?.length
    ? {
        low: Math.min(...matches.map((m) => m.hourly_rate_cents)),
        high: Math.max(...matches.map((m) => m.hourly_rate_cents)),
      }
    : null;

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <h1 className="max-w-[17ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
          Don't want to compare forty profiles?
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-hk-muted">
          Four questions. We'll show you three independent cleaners who cover your ZIP and are
          taking work, and tell you why each one came up. No address needed.
        </p>

        <form className="mt-10 grid max-w-[760px] gap-5 rounded-hk-lg border border-hk-line bg-hk-paper p-7 sm:grid-cols-2"
          onSubmit={run}>
          <Field label="Your ZIP code" hint="So we can measure who is actually near you.">
            <input className={inputClass} inputMode="numeric" maxLength={5}
              onChange={(e) => setZip(e.target.value)} pattern="[0-9]{5}" required value={zip} />
          </Field>
          <Field label="What are we cleaning?">
            <select className={inputClass}
              onChange={(e) => setSize(SIZES.find((s) => s.id === e.target.value) ?? SIZES[1])}
              value={size.id}>
              {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Anything particular?" hint="Optional. Leave blank to see everyone nearby.">
              <select className={inputClass} onChange={(e) => setSpecialty(e.target.value)} value={specialty}>
                <option value="">No preference</option>
                {SPECIALTIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button className="w-full rounded-full bg-hk-accent px-6 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-60"
              disabled={busy} type="submit">
              {busy ? "Finding people" : "Show me three cleaners"}
            </button>
          </div>
        </form>

        {error ? <div className="mt-6 max-w-[760px]"><Notice tone="error">{error}</Notice></div> : null}

        {matches !== null && matches.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              body="Nobody is covering that ZIP and taking work right now. Try browsing the full directory — some cleaners travel further than their listed radius."
              icon="pin" title="No matches in that ZIP" />
          </div>
        ) : null}

        {matches && matches.length > 0 ? (
          <>
            {rates ? (
              <div className="mt-12 max-w-[760px] rounded-hk-lg border border-hk-line bg-hk-accent-wash p-6">
                <h2 className="font-hk-display text-lg font-medium tracking-tight text-hk-ink">
                  What this will cost, roughly
                </h2>
                <p className="mt-2 text-base leading-relaxed text-hk-ink-soft">
                  For {size.label.toLowerCase()} at about {size.hours} hours, these three would
                  come to between{" "}
                  <strong className="font-medium">{money(estimate(rates.low, size.hours))}</strong>
                  {" and "}
                  <strong className="font-medium">{money(estimate(rates.high, size.hours))}</strong>.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-hk-muted">
                  Their own rates, live from their listings — not a price we set. You pay them
                  directly and we take no commission.
                </p>
              </div>
            ) : null}

            <div className="hk-stagger mt-8 grid gap-5 lg:grid-cols-3">
              {matches.map((m, i) => {
                const avg = ratingAverage(m.rating_sum, m.rating_count);
                return (
                  <article className="hk-card flex flex-col overflow-hidden rounded-hk-lg border border-hk-line bg-hk-paper" key={m.user_id}>
                    <div className="hk-card-media">
                      <img alt={m.name} className="h-52 w-full object-cover" height={900} loading="lazy"
                        src={m.avatar ?? "/assets/brand/mark.png"} width={720}
                        onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback !== "1") { t.dataset.fallback = "1"; t.src = "/assets/brand/mark.png"; } }} />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <span className="font-hk-mono text-xs uppercase tracking-[0.12em] text-hk-accent">
                        {reasonFor(m, i, specialty)}
                      </span>
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <h3 className="font-hk-display text-lg font-medium tracking-tight text-hk-ink">{m.name}</h3>
                        <span className="hk-tabular whitespace-nowrap font-hk-display text-xl font-semibold tracking-tighter text-hk-accent">
                          {money(m.hourly_rate_cents)}
                          <span className="font-hk-mono text-xs font-normal text-hk-muted">/hr</span>
                        </span>
                      </div>
                      <p className="mt-1.5 flex items-center gap-2 text-sm text-hk-muted">
                        <Stars size={13} value={avg} />
                        {m.rating_count > 0 ? `${avg} of 5` : "Not yet rated"}
                      </p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-hk-ink">{m.headline}</p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                        {m.id_verified ? (
                          <span className="flex items-center gap-1.5 font-hk-mono text-xs text-hk-muted">
                            <Icon name="shield" size={13} />ID verified
                          </span>
                        ) : null}
                        {m.background_check ? (
                          <span className="flex items-center gap-1.5 font-hk-mono text-xs text-hk-muted">
                            <Icon name="shield" size={13} />Background checked
                          </span>
                        ) : null}
                      </div>
                      <a className="mt-6 w-full rounded-full bg-hk-ink px-5 py-3 text-center font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep"
                        href={`/find?cleaner=${m.user_id}`}>
                        Request {m.name.split(" ")[0]}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mt-8 text-sm text-hk-muted">
              Not quite right? <a className="underline underline-offset-4" href="/find">Browse everyone</a>{" "}
              and choose for yourself. Minimum booking is {MIN_HOURS} hours.
            </p>
          </>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
