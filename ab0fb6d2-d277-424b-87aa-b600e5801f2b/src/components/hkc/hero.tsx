import { useEffect, useState } from "react";

import { apiGet } from "./chrome";
import { Icon, Stars } from "./ui";
import { money, ratingAverage } from "@/lib/hkc/domain";

interface Preview {
  user_id: string; name: string; headline: string | null; areas: string | null;
  avatar: string | null; hourly_rate_cents: number; rating_sum: number; rating_count: number;
  specialties: string;
}

const FILTERS = [
  { id: "", label: "Everyone" },
  { id: "deep", label: "Deep cleans" },
  { id: "recurring", label: "Weekly upkeep" },
  { id: "commercial", label: "Offices" },
];

export function Hero() {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState<Preview[] | null>(null);

  useEffect(() => {
    let live = true;
    setRows(null);
    apiGet<{ cleaners: Preview[] }>(`directory&specialty=${encodeURIComponent(filter)}&limit=3`)
      .then((d) => { if (live) setRows(d.cleaners); })
      .catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [filter]);

  return (
    <section className="relative isolate overflow-hidden border-b border-hk-line">
      <img alt="" aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
        height={900} src="/assets/brand/hero.jpg" width={1600} />
      <div aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-hk-ground via-hk-ground/94 to-hk-ground/35" />

      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div>
          <span className="hk-enter hk-enter-1 inline-flex items-center gap-2 rounded-full border border-hk-line bg-hk-paper/80 px-3.5 py-1.5 font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted backdrop-blur">
            <Icon name="pin" size={14} />
            Los Angeles and Orange County
          </span>
          <h1 className="hk-enter hk-enter-2 mt-6 max-w-[13ch] font-hk-display text-5xl font-semibold leading-[0.95] tracking-tighter text-hk-ink md:text-7xl">
            Meet your cleaner, not a call centre
          </h1>
          <p className="hk-enter hk-enter-3 mt-6 max-w-[48ch] text-lg leading-relaxed text-hk-muted">
            We are a referral agency. Browse independent, background checked cleaners, see the rate
            each one sets, and request the person you want. You pay them directly.
          </p>
          <div className="hk-enter hk-enter-4 mt-9 flex flex-wrap items-center gap-8">
            <a className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-hk-accent px-8 py-4 font-hk-display text-base font-medium tracking-tight text-hk-ground transition-transform duration-200 active:scale-[0.98]"
              href="/find">
              <span aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-hk-accent-deep transition-transform duration-400 ease-out group-hover:translate-x-0" />
              <span className="relative">Find a cleaner</span>
              <span aria-hidden="true" className="relative transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </a>
            <a className="group relative inline-flex flex-col items-start font-hk-display text-base font-medium tracking-tight text-hk-ink"
              href="/cleaners">
              <span>Get referrals</span>
              <span aria-hidden="true"
                className="mt-1 block h-px w-full origin-left scale-x-0 bg-hk-ink transition-transform duration-400 ease-out group-hover:scale-x-100" />
            </a>
          </div>
        </div>

        <div className="hk-enter hk-enter-3">
          <div className="rounded-hk-lg border border-hk-line bg-hk-paper/95 p-6 shadow-[0_28px_70px_-40px_rgba(19,26,22,0.5)] backdrop-blur">
            <div className="flex items-baseline justify-between">
              <h2 className="font-hk-display text-lg font-medium tracking-tight text-hk-ink">Taking work now</h2>
              <span className="font-hk-mono text-xs uppercase tracking-[0.12em] text-hk-muted">Live</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <button className={`rounded-full border px-3 py-1.5 font-hk-mono text-xs transition-colors ${filter === option.id ? "border-hk-accent bg-hk-accent-wash text-hk-accent-deep" : "border-hk-line text-hk-muted hover:border-hk-ink hover:text-hk-ink"}`}
                  key={option.id} onClick={() => setFilter(option.id)} type="button">
                  {option.label}
                </button>
              ))}
            </div>

            <ul className="mt-5 divide-y divide-hk-line border-y border-hk-line">
              {rows === null
                ? [0, 1, 2].map((n) => (
                    <li className="flex items-center gap-4 py-4" key={n}>
                      <span className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-hk-line" />
                      <span className="flex-1">
                        <span className="block h-3 w-28 animate-pulse rounded bg-hk-line" />
                        <span className="mt-2 block h-3 w-40 animate-pulse rounded bg-hk-line" />
                      </span>
                    </li>
                  ))
                : rows.length === 0
                  ? <li className="py-6 text-sm text-hk-muted">Nobody listed for that yet. Try another filter.</li>
                  : rows.map((person) => {
                      const avg = ratingAverage(person.rating_sum, person.rating_count);
                      return (
                        <li className="flex items-center gap-4 py-4" key={person.user_id}>
                          <img alt="" aria-hidden="true" className="h-12 w-12 shrink-0 rounded-full object-cover"
                            height={720} src={person.avatar ?? "/assets/brand/mark.png"} onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback !== "1") { t.dataset.fallback = "1"; t.src = "/assets/brand/mark.png"; } }} width={720} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-hk-display text-base font-medium tracking-tight text-hk-ink">
                              {person.name}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-xs text-hk-muted">
                              <Stars size={11} value={avg} />
                              {person.rating_count > 0 ? `${avg} of 5` : "New"}
                            </span>
                          </span>
                          <span className="hk-tabular shrink-0 text-right font-hk-display text-lg font-semibold tracking-tighter text-hk-accent">
                            {money(person.hourly_rate_cents)}
                            <span className="block font-hk-mono text-xs font-normal text-hk-muted">their rate</span>
                          </span>
                        </li>
                      );
                    })}
            </ul>

            <a className="mt-5 block rounded-full bg-hk-ink px-6 py-3.5 text-center font-hk-display text-base font-medium text-hk-ground transition-colors duration-200 hover:bg-hk-accent-deep active:scale-[0.99]"
              href="/find">
              Browse the whole directory
            </a>
            <p className="mt-3 text-center text-xs text-hk-muted">
              Clients pay HomeKey Clean nothing. Cleaners pay for their listing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
