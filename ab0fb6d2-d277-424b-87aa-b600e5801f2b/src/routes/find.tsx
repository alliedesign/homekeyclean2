import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SiteFooter, SiteNav, apiGet, apiPost, useMe } from "@/components/hkc/chrome";
import {
  EmptyState, Field, Icon, Notice, Panel, RowSkeleton, Stars, inputClass,
} from "@/components/hkc/ui";
import {
  ADDONS, ALL_CITIES, DISCLOSURE_CLIENT, FREQUENCIES, MIN_HOURS, SPECIALTIES, STANDING_COPY,
  estimate, hoursLabel, money, ratingAverage, specialtyLabel, standingFor, totalHours,
} from "@/lib/hkc/domain";

export const Route = createFileRoute("/find")({
  component: Find,
  head: () => ({ meta: [{ title: "Find a cleaner" }] }),
});

interface DirectoryCleaner {
  user_id: string; name: string; headline: string | null; bio: string | null; areas: string | null;
  years_experience: number; rating_sum: number; rating_count: number; jobs_completed: number;
  avatar: string | null; hourly_rate_cents: number; plan: string; specialties: string;
}

const HOUR_CHOICES = [2, 2.5, 3, 3.5, 4, 5, 6, 8];

function parseList(raw: string | null): string[] {
  try {
    const parsed = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function Find() {
  const { me } = useMe();
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [rows, setRows] = useState<DirectoryCleaner[] | null>(null);
  const [chosen, setChosen] = useState<DirectoryCleaner | null>(null);

  const load = useCallback(() => {
    setRows(null);
    apiGet<{ cleaners: DirectoryCleaner[] }>(
      `directory&city=${encodeURIComponent(city)}&specialty=${encodeURIComponent(specialty)}`,
    )
      .then((d) => setRows(d.cleaners))
      .catch(() => setRows([]));
  }, [city, specialty]);

  useEffect(load, [load]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <h1 className="max-w-[15ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
          Choose who cleans your home
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-hk-muted">
          Every cleaner here is independent, sets their own rate, and runs their own business. We
          introduce you, then step out of the way. You pay them directly.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-y border-hk-line py-5">
          <label className="flex items-center gap-3">
            <Icon name="pin" size={18} />
            <select className={`${inputClass} w-auto min-w-[200px]`} onChange={(e) => setCity(e.target.value)} value={city}>
              <option value="">Every city we cover</option>
              {ALL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3">
            <Icon name="sparkle" size={18} />
            <select className={`${inputClass} w-auto min-w-[200px]`} onChange={(e) => setSpecialty(e.target.value)} value={specialty}>
              <option value="">Any speciality</option>
              {SPECIALTIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          {city || specialty ? (
            <button className="font-hk-body text-sm text-hk-muted underline-offset-4 hover:text-hk-ink hover:underline"
              onClick={() => { setCity(""); setSpecialty(""); }} type="button">
              Clear filters
            </button>
          ) : null}
        </div>

        {rows === null ? (
          <div className="mt-10"><RowSkeleton rows={3} /></div>
        ) : rows.length === 0 ? (
          <div className="mt-10">
            <EmptyState body="No cleaner matches those filters yet. Try a neighbouring city, or clear the speciality and see everyone taking work."
              icon="pin" title="Nobody here yet" />
          </div>
        ) : (
          <div className="hk-stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((person) => {
              const avg = ratingAverage(person.rating_sum, person.rating_count);
              const standing = standingFor(avg, person.jobs_completed);
              return (
                <article className="hk-card flex flex-col overflow-hidden rounded-hk-lg border border-hk-line bg-hk-paper" key={person.user_id}>
                  <div className="hk-card-media relative">
                    <img alt={person.name} className="h-60 w-full object-cover" height={900}
                      loading="lazy" src={person.avatar ?? "/assets/brand/mark.png"} width={720} />
                    {person.plan === "pro" ? (
                      <span className="absolute left-4 top-4 rounded-full bg-hk-accent px-3 py-1 font-hk-mono text-xs uppercase tracking-[0.1em] text-hk-ground">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-hk-display text-lg font-medium tracking-tight text-hk-ink">{person.name}</h2>
                      <span className="hk-tabular whitespace-nowrap font-hk-display text-xl font-semibold tracking-tighter text-hk-accent">
                        {money(person.hourly_rate_cents)}
                        <span className="font-hk-mono text-xs font-normal text-hk-muted">/hr</span>
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-hk-muted">
                      <Stars size={13} value={avg} />
                      {person.rating_count > 0 ? `${avg} of 5` : "Not yet rated"}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-hk-ink">{person.headline}</p>
                    <p className="mt-2 text-sm text-hk-muted">{person.areas}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-hk-line px-2.5 py-1 font-hk-mono text-xs text-hk-muted">
                        {STANDING_COPY[standing].label}
                      </span>
                      {parseList(person.specialties).slice(0, 2).map((id) => (
                        <span className="rounded-full bg-hk-accent-wash px-2.5 py-1 font-hk-mono text-xs text-hk-accent-deep" key={id}>
                          {specialtyLabel(id)}
                        </span>
                      ))}
                    </div>
                    <button className="mt-6 w-full rounded-full bg-hk-ink px-5 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors duration-200 hover:bg-hk-accent-deep active:scale-[0.99]"
                      onClick={() => setChosen(person)} type="button">
                      Request {person.name.split(" ")[0]}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      {chosen ? (
        <RequestPanel cleaner={chosen} onClose={() => setChosen(null)} signedIn={Boolean(me?.user)} />
      ) : null}
      <SiteFooter />
    </>
  );
}

function RequestPanel({ cleaner, onClose, signedIn }: {
  cleaner: DirectoryCleaner;
  onClose: () => void;
  signedIn: boolean;
}) {
  const [serviceType, setServiceType] = useState<"residential" | "commercial">("residential");
  const [baseHours, setBaseHours] = useState(3);
  const [addons, setAddons] = useState<string[]>([]);
  const [ack, setAck] = useState(false);
  const [form, setForm] = useState({
    accessNotes: "", address: "", bathrooms: "1", bedrooms: "1", city: "Los Angeles",
    frequency: "once", notes: "", pets: "", scheduledAt: "", sqft: "", unit: "", zip: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const hours = useMemo(() => totalHours(baseHours, addons), [addons, baseHours]);
  const total = estimate(cleaner.hourly_rate_cents, hours);
  const firstName = cleaner.name.split(" ")[0];
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiPost("/api/act", {
        action: "request", addons, cleanerId: cleaner.user_id, disclosureAck: ack, hours,
        serviceType, ...form,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-hk-ink/45 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-[720px]">
        <Panel className="relative">
          <button aria-label="Close" className="absolute right-5 top-5 rounded-full border border-hk-line bg-hk-paper px-3 py-1 text-sm text-hk-muted transition-colors hover:border-hk-ink hover:text-hk-ink"
            onClick={onClose} type="button">
            Close
          </button>

          {sent ? (
            <div className="py-8 text-center">
              <Icon className="mx-auto" name="sparkle" size={48} />
              <h2 className="mt-5 font-hk-display text-3xl font-semibold tracking-tighter text-hk-ink">
                Request sent to {firstName}
              </h2>
              <p className="mx-auto mt-4 max-w-[46ch] text-base leading-relaxed text-hk-muted">
                They will accept or decline it. If they accept you get their contact details, and you
                arrange payment with them directly at {money(cleaner.hourly_rate_cents)} an hour.
              </p>
              <a className="mt-7 inline-block rounded-full bg-hk-accent px-6 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep" href="/account">
                Track this request
              </a>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 pr-20">
                <img alt="" aria-hidden="true" className="h-16 w-16 rounded-full object-cover"
                  height={720} src={cleaner.avatar ?? "/assets/brand/mark.png"} width={720} />
                <div>
                  <h2 className="font-hk-display text-2xl font-semibold tracking-tight text-hk-ink">{cleaner.name}</h2>
                  <p className="mt-1 text-sm text-hk-muted">
                    Sets their own rate at {money(cleaner.hourly_rate_cents)} an hour
                    {cleaner.years_experience ? `, ${cleaner.years_experience} years cleaning` : ""}
                  </p>
                </div>
              </div>

              {!signedIn ? (
                <div className="mt-6">
                  <Notice tone="error">
                    <a className="underline" href="/signin">Sign in or make an account</a> to send this request.
                  </Notice>
                </div>
              ) : null}

              <form className="mt-7 space-y-5" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-3">
                  {([["residential", "house", "A home"], ["commercial", "building", "An office"]] as const).map(
                    ([value, icon, label]) => (
                      <button className={`flex items-center gap-3 rounded-hk border px-4 py-3 text-left transition-colors ${serviceType === value ? "border-hk-accent bg-hk-accent-wash" : "border-hk-line hover:border-hk-ink"}`}
                        key={value} onClick={() => setServiceType(value)} type="button">
                        <Icon name={icon} size={22} />
                        <span className="font-hk-display text-base font-medium text-hk-ink">{label}</span>
                      </button>
                    ),
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Street address">
                      <input className={inputClass} onChange={set("address")} required value={form.address} />
                    </Field>
                  </div>
                  <Field label="City">
                    <select className={inputClass} onChange={set("city")} value={form.city}>
                      {ALL_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="ZIP code">
                    <input className={inputClass} inputMode="numeric" maxLength={5} onChange={set("zip")}
                      pattern="[0-9]{5}" required value={form.zip} />
                  </Field>
                  <Field label="Date and start time">
                    <input className={inputClass} onChange={set("scheduledAt")} required
                      type="datetime-local" value={form.scheduledAt} />
                  </Field>
                  <Field label="How often">
                    <select className={inputClass} onChange={set("frequency")} value={form.frequency}>
                      {FREQUENCIES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </Field>
                  {serviceType === "residential" ? (
                    <>
                      <Field label="Bedrooms">
                        <input className={inputClass} min={0} onChange={set("bedrooms")} type="number" value={form.bedrooms} />
                      </Field>
                      <Field label="Bathrooms">
                        <input className={inputClass} min={0} onChange={set("bathrooms")} type="number" value={form.bathrooms} />
                      </Field>
                    </>
                  ) : (
                    <Field label="Square feet">
                      <input className={inputClass} min={0} onChange={set("sqft")} type="number" value={form.sqft} />
                    </Field>
                  )}
                  <Field label="Hours" hint={`Minimum ${MIN_HOURS}. Extras add time.`}>
                    <select className={inputClass} onChange={(e) => setBaseHours(Number(e.target.value))} value={baseHours}>
                      {HOUR_CHOICES.map((h) => <option key={h} value={h}>{h} hours</option>)}
                    </select>
                  </Field>
                </div>

                <fieldset>
                  <legend className="font-hk-display text-sm font-medium text-hk-ink">Extras</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ADDONS.map((addon) => {
                      const on = addons.includes(addon.id);
                      return (
                        <button className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${on ? "border-hk-accent bg-hk-accent-wash text-hk-accent-deep" : "border-hk-line text-hk-muted hover:border-hk-ink"}`}
                          key={addon.id}
                          onClick={() => setAddons((l) => (l.includes(addon.id) ? l.filter((x) => x !== addon.id) : [...l, addon.id]))}
                          type="button">
                          {addon.label}
                          <span className="ml-2 font-hk-mono text-xs opacity-70">+{addon.minutes}m</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <Field label="Getting in" hint="Lockbox code, doorman, where the key lives.">
                  <input className={inputClass} onChange={set("accessNotes")} value={form.accessNotes} />
                </Field>
                <Field label="Pets and anything else">
                  <textarea className={inputClass} onChange={set("notes")} rows={2} value={form.notes} />
                </Field>

                <div className="rounded-hk border border-hk-line bg-hk-ground p-5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-hk-display text-base font-medium text-hk-ink">
                      {hoursLabel(hours)} at {money(cleaner.hourly_rate_cents)}
                    </span>
                    <span className="hk-tabular font-hk-display text-3xl font-semibold tracking-tighter text-hk-accent">
                      {money(total)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-hk-muted">
                    An estimate at their rate, not a charge. You pay {firstName} directly. HomeKey
                    Clean takes no payment from you.
                  </p>
                </div>

                <label className="flex cursor-pointer gap-3 rounded-hk border border-hk-line p-4 text-xs leading-relaxed text-hk-muted">
                  <input checked={ack} className="mt-0.5 h-4 w-4 shrink-0 accent-hk-accent"
                    onChange={(e) => setAck(e.target.checked)} type="checkbox" />
                  <span>{DISCLOSURE_CLIENT}</span>
                </label>

                {error ? <Notice tone="error">{error}</Notice> : null}
                <button className="w-full rounded-full bg-hk-accent px-6 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-60"
                  disabled={busy || !signedIn || !ack} type="submit">
                  {busy ? "Sending" : `Send request to ${firstName}`}
                </button>
              </form>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
