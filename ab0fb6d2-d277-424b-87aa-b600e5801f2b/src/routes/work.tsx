import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { SiteFooter, SiteNav, apiGet, apiPost, type MeCleaner } from "@/components/hkc/chrome";
import {
  ClaimCta, EmptyState, Field, Icon, Notice, Panel, RowSkeleton, Stars, StatusPill, inputClass,
} from "@/components/hkc/ui";
import {
  DISCLOSURE_CLEANER, PLANS, SPECIALTIES, formatWhen, hoursLabel, money, planFor,
  ratingAverage, specialtyLabel,
} from "@/lib/hkc/domain";

export const Route = createFileRoute("/work")({
  component: Work,
  head: () => ({ meta: [{ title: "My referrals" }] }),
});

interface Referral {
  id: string; status: string; hours: number; hourly_rate_cents: number; estimate_cents: number;
  lead_fee_cents: number; scheduled_at: string; address: string; unit: string | null; city: string;
  county: string; service_type: string; addons: string; pets: string | null;
  access_notes: string | null; notes: string | null; bedrooms: number | null;
  bathrooms: number | null; sqft: number | null; frequency: string; client_name: string;
  client_phone: string | null; client_email: string | null; review_stars: number | null;
}

interface Stats { earnedCents: number; bookedCents: number; feesCents: number }

function Work() {
  const [rows, setRows] = useState<Referral[] | null>(null);
  const [cleaner, setCleaner] = useState<MeCleaner | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    apiGet<{ cleaner: MeCleaner; referrals: Referral[]; stats: Stats }>("work")
      .then((d) => { setRows(d.referrals); setCleaner(d.cleaner); setStats(d.stats); })
      .catch((e: Error) => { setError(e.message); setRows([]); });
  }, []);

  useEffect(load, [load]);

  async function act(id: string, payload: Record<string, unknown>, message: string) {
    setBusyId(id);
    setError("");
    try {
      await apiPost("/api/act", { referralId: id, ...payload });
      setFlash(message);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusyId("");
  }

  const rating = cleaner ? ratingAverage(cleaner.rating_sum, cleaner.rating_count) : 0;
  const inbox = (rows ?? []).filter((r) => r.status === "requested");
  const booked = (rows ?? []).filter((r) => r.status === "accepted");
  const past = (rows ?? []).filter((r) => ["completed", "declined", "cancelled"].includes(r.status));

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
            My referrals
          </h1>
          <button className="font-hk-body text-sm text-hk-muted underline-offset-4 hover:text-hk-ink hover:underline"
            onClick={() => apiPost("/api/auth", { action: "signout" }).then(() => { window.location.href = "/"; })}
            type="button">
            Sign out
          </button>
        </div>

        {error ? <div className="mt-8"><Notice tone="error">{error}</Notice></div> : null}
        {flash ? <div className="mt-8"><Notice tone="good">{flash}</Notice></div> : null}

        {cleaner ? (
          <div className="mt-10 grid gap-px overflow-hidden rounded-hk-lg border border-hk-line bg-hk-line sm:grid-cols-4">
            <div className="bg-hk-paper p-6">
              <span className="font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted">Your rate</span>
              <p className="hk-tabular mt-3 font-hk-display text-2xl font-semibold tracking-tighter text-hk-accent">
                {money(cleaner.hourly_rate_cents)}<span className="font-hk-mono text-xs font-normal text-hk-muted">/hr</span>
              </p>
              <p className="mt-2 text-sm text-hk-muted">You set this, not us</p>
            </div>
            <div className="bg-hk-paper p-6">
              <span className="font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted">Your plan</span>
              <p className="mt-3 font-hk-display text-2xl font-semibold tracking-tighter text-hk-ink">
                {planFor(cleaner.plan).name}
              </p>
              <p className="mt-2 text-sm text-hk-muted">
                {planFor(cleaner.plan).monthlyCents === 0
                  ? `${money(planFor(cleaner.plan).leadFeeCents)} per accepted job`
                  : `${money(planFor(cleaner.plan).monthlyCents)} a month`}
              </p>
            </div>
            <div className="bg-hk-paper p-6">
              <span className="font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted">Fees owed</span>
              <p className="hk-tabular mt-3 font-hk-display text-2xl font-semibold tracking-tighter text-hk-ink">
                {money(cleaner.fees_owed_cents ?? 0)}
              </p>
              <p className="mt-2 text-sm text-hk-muted">{money(stats?.feesCents ?? 0)} billed all time</p>
            </div>
            <div className="bg-hk-paper p-6">
              <span className="font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted">Reputation</span>
              <div className="mt-3"><Stars value={rating} /></div>
              <p className="mt-2 text-sm text-hk-muted">
                {cleaner.jobs_completed} jobs{rating ? `, ${rating} average` : ", no ratings yet"}
              </p>
            </div>
          </div>
        ) : null}

        {cleaner && cleaner.status !== "active" ? (
          <div className="mt-8">
            <Notice tone="error">
              Your profile is not listed yet. Fill in the details below and tick all three checks,
              and you appear in the directory.
            </Notice>
          </div>
        ) : null}

        <section className="mt-16">
          <h2 className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-muted">Waiting on you</h2>
          {rows === null ? (
            <div className="mt-5"><RowSkeleton rows={2} /></div>
          ) : inbox.length === 0 ? (
            <div className="mt-5">
              <EmptyState body="No open requests. Clients find you in the directory and request you by name, so a fuller profile and a clear speciality bring more of them."
                icon="calendar" title="Nothing waiting" />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {inbox.map((job) => (
                <Panel key={job.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <StatusPill status={job.status} />
                      <h3 className="mt-3 font-hk-display text-xl font-medium tracking-tight text-hk-ink">
                        {formatWhen(job.scheduled_at)}
                      </h3>
                      <p className="mt-1 text-sm text-hk-muted">
                        {job.client_name} · {job.city}, {job.county} · {hoursLabel(job.hours)} ·{" "}
                        {job.service_type === "commercial"
                          ? `${job.sqft ?? "?"} sq ft office`
                          : `${job.bedrooms ?? 0} bed, ${job.bathrooms ?? 0} bath`}
                      </p>
                      <JobDetails job={job} />
                    </div>
                    <div className="text-right">
                      <span className="hk-tabular block font-hk-display text-3xl font-semibold tracking-tighter text-hk-accent">
                        {money(job.estimate_cents)}
                      </span>
                      <span className="font-hk-mono text-xs text-hk-muted">
                        paid to you directly
                      </span>
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <ClaimCta busy={busyId === job.id}
                          label={job.lead_fee_cents > 0 ? `Accept, ${money(job.lead_fee_cents)} fee` : "Accept"}
                          onClick={() => act(job.id, { action: "accept" }, "Accepted. The client now has your contact details.")} />
                        <button className="rounded-[6px] border border-hk-line px-4 py-2.5 font-hk-display text-sm text-hk-muted transition-colors hover:border-hk-ink hover:text-hk-ink disabled:opacity-50"
                          disabled={busyId === job.id}
                          onClick={() => act(job.id, { action: "decline", reason: "Not available" }, "Declined. No fee charged.")}
                          type="button">
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-muted">Booked and past</h2>
          {rows === null ? (
            <div className="mt-5"><RowSkeleton rows={2} /></div>
          ) : booked.length + past.length === 0 ? (
            <div className="mt-5">
              <EmptyState body="Accepted jobs land here with the full address and the client's phone number, plus the button that marks the work finished."
                icon="key" title="Nothing booked yet" />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {[...booked, ...past].map((job) => (
                <Panel key={job.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <StatusPill status={job.status} />
                      <h3 className="mt-3 font-hk-display text-xl font-medium tracking-tight text-hk-ink">
                        {formatWhen(job.scheduled_at)}
                      </h3>
                      <p className="mt-1 text-sm text-hk-muted">
                        {job.address}{job.unit ? `, ${job.unit}` : ""}, {job.city} · {job.client_name}
                      </p>
                      {job.status === "accepted" ? (
                        <p className="mt-2 flex flex-wrap gap-4 text-sm text-hk-accent-deep">
                          {job.client_phone ? <span>{job.client_phone}</span> : null}
                          {job.client_email ? <span>{job.client_email}</span> : null}
                        </p>
                      ) : null}
                      <JobDetails job={job} showAccess />
                      {job.review_stars ? (
                        <p className="mt-3 flex items-center gap-2 text-sm text-hk-muted">
                          Rated <Stars size={13} value={job.review_stars} />
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="hk-tabular block font-hk-display text-2xl font-semibold tracking-tighter text-hk-ink">
                        {money(job.estimate_cents)}
                      </span>
                      <span className="font-hk-mono text-xs text-hk-muted">
                        {job.lead_fee_cents > 0 ? `${money(job.lead_fee_cents)} referral fee` : "no referral fee"}
                      </span>
                      {job.status === "accepted" ? (
                        <button className="mt-4 rounded-full bg-hk-accent px-5 py-2.5 font-hk-display text-sm font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-50"
                          disabled={busyId === job.id}
                          onClick={() => act(job.id, { action: "complete" }, "Marked finished.")}
                          type="button">
                          Mark it done
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </section>

        {cleaner ? <ProfilePanel cleaner={cleaner} onSaved={load} /> : null}
      </main>
      <SiteFooter />
    </>
  );
}

function JobDetails({ job, showAccess }: { job: Referral; showAccess?: boolean }) {
  let extras: string[] = [];
  try {
    const parsed = JSON.parse(job.addons) as unknown;
    extras = Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    extras = [];
  }
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-hk-muted">
      {extras.length > 0 ? (
        <li className="flex items-center gap-2"><Icon name="towels" size={15} /> Extras: {extras.join(", ")}</li>
      ) : null}
      {job.pets ? <li className="flex items-center gap-2"><Icon name="sparkle" size={15} /> Pets: {job.pets}</li> : null}
      {showAccess && job.access_notes ? (
        <li className="flex items-center gap-2"><Icon name="key" size={15} /> Access: {job.access_notes}</li>
      ) : null}
      {showAccess && job.notes ? (
        <li className="flex items-center gap-2"><Icon name="pin" size={15} /> Notes: {job.notes}</li>
      ) : null}
    </ul>
  );
}

function ProfilePanel({ cleaner, onSaved }: { cleaner: MeCleaner; onSaved: () => void }) {
  const [form, setForm] = useState({
    areas: cleaner.areas ?? "",
    bio: cleaner.bio ?? "",
    headline: cleaner.headline ?? "",
    rate: String(Math.round((cleaner.hourly_rate_cents ?? 4000) / 100)),
    years: String(cleaner.years_experience ?? 0),
  });
  const [specialties, setSpecialties] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(cleaner.specialties ?? "[]") as unknown;
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });
  const [accepting, setAccepting] = useState(Boolean(cleaner.accepting));
  const [checks, setChecks] = useState({
    backgroundCheck: Boolean(cleaner.background_check),
    businessLicense: Boolean(cleaner.payment_on_file),
    idVerified: Boolean(cleaner.id_verified),
  });
  const [plan, setPlan] = useState(cleaner.plan ?? "listed");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(event: { preventDefault: () => void }) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const res = await apiPost<{ status: string }>("/api/act", {
        accepting, action: "profile", areas: form.areas, backgroundCheck: checks.backgroundCheck,
        bio: form.bio, businessLicense: checks.businessLicense, headline: form.headline,
        hourlyRateCents: Math.round(Number(form.rate) * 100), idVerified: checks.idVerified,
        specialties, years: Number(form.years),
      });
      setSaved(res.status === "active"
        ? "Saved. You are listed in the directory."
        : "Saved. Tick all three checks and you go live in the directory.");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  }

  async function switchPlan(planId: string) {
    setPlan(planId);
    await apiPost("/api/act", { action: "plan", planId }).catch(() => undefined);
    onSaved();
  }

  return (
    <section className="mt-16" id="profile">
      <h2 className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-muted">Your listing</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <Panel>
          <form className="space-y-4" onSubmit={save}>
            <Field label="Your hourly rate in dollars" hint="You set this. We never change it and never take a cut of it.">
              <input className={inputClass} max={150} min={25} onChange={set("rate")} required
                type="number" value={form.rate} />
            </Field>
            <Field label="One line about your work">
              <input className={inputClass} onChange={set("headline")} required
                placeholder="Deep cleans and move outs" value={form.headline} />
            </Field>
            <Field label="Neighbourhoods you cover" hint="Comma separated. Clients filter by city.">
              <input className={inputClass} onChange={set("areas")} required
                placeholder="Silver Lake, Echo Park, Los Feliz" value={form.areas} />
            </Field>
            <Field label="Years cleaning professionally">
              <input className={inputClass} min={0} onChange={set("years")} type="number" value={form.years} />
            </Field>
            <Field label="More about you">
              <textarea className={inputClass} onChange={set("bio")} rows={3} value={form.bio} />
            </Field>
            <fieldset>
              <legend className="mb-2 font-hk-display text-sm font-medium text-hk-ink">Specialities</legend>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => {
                  const on = specialties.includes(s.id);
                  return (
                    <button className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${on ? "border-hk-accent bg-hk-accent-wash text-hk-accent-deep" : "border-hk-line text-hk-muted hover:border-hk-ink"}`}
                      key={s.id}
                      onClick={() => setSpecialties((l) => (l.includes(s.id) ? l.filter((x) => x !== s.id) : [...l, s.id]))}
                      type="button">
                      {specialtyLabel(s.id)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="flex cursor-pointer items-center gap-3 rounded-hk border border-hk-line bg-hk-ground p-4 text-sm text-hk-ink">
              <input checked={accepting} className="h-4 w-4 accent-hk-accent"
                onChange={(e) => setAccepting(e.target.checked)} type="checkbox" />
              I am taking new clients right now
            </label>
            <fieldset className="space-y-2.5 rounded-hk border border-hk-line bg-hk-ground p-4">
              <legend className="px-1 font-hk-display text-sm font-medium text-hk-ink">Required to be listed</legend>
              {([["idVerified", "Identity verified"], ["backgroundCheck", "Background check passed"], ["businessLicense", "Business licence on file"]] as const).map(
                ([key, label]) => (
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-hk-ink" key={key}>
                    <input checked={checks[key]} className="h-4 w-4 accent-hk-accent"
                      onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))}
                      type="checkbox" />
                    {label}
                  </label>
                ),
              )}
            </fieldset>
            {error ? <Notice tone="error">{error}</Notice> : null}
            {saved ? <Notice tone="good">{saved}</Notice> : null}
            <button className="w-full rounded-full bg-hk-accent px-6 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-60"
              disabled={busy} type="submit">
              {busy ? "Saving" : "Save my listing"}
            </button>
          </form>
        </Panel>

        <div className="space-y-5">
          {PLANS.map((option) => {
            const on = plan === option.id;
            return (
              <button className={`hk-card block w-full rounded-hk-lg border p-6 text-left ${on ? "border-hk-accent bg-hk-accent-wash" : "border-hk-line bg-hk-paper"}`}
                key={option.id} onClick={() => switchPlan(option.id)} type="button">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-hk-display text-xl font-medium tracking-tight text-hk-ink">{option.name}</h3>
                  <span className="hk-tabular font-hk-display text-2xl font-semibold tracking-tighter text-hk-accent">
                    {option.monthlyCents === 0 ? "Free" : money(option.monthlyCents)}
                    {option.monthlyCents > 0 ? <span className="font-hk-mono text-xs font-normal text-hk-muted">/mo</span> : null}
                  </span>
                </div>
                <p className="mt-2 text-sm text-hk-muted">{option.blurb}</p>
                <ul className="mt-4 space-y-1.5">
                  {option.perks.map((perk) => (
                    <li className="flex gap-2 text-sm text-hk-ink" key={perk}>
                      <Icon className="mt-0.5 shrink-0" name="shield" size={15} />
                      {perk}
                    </li>
                  ))}
                </ul>
                <span className={`mt-4 inline-block font-hk-mono text-xs uppercase tracking-[0.12em] ${on ? "text-hk-accent-deep" : "text-hk-muted"}`}>
                  {on ? "Your current plan" : "Switch to this"}
                </span>
              </button>
            );
          })}
          <p className="rounded-hk border border-hk-line bg-hk-ground p-5 text-xs leading-relaxed text-hk-muted">
            {DISCLOSURE_CLEANER}
          </p>
        </div>
      </div>
    </section>
  );
}
