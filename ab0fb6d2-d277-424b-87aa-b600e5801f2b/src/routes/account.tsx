import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { SiteFooter, SiteNav, apiGet, apiPost } from "@/components/hkc/chrome";
import {
  EmptyState, Field, Icon, Notice, Panel, RowSkeleton, StarPicker, Stars, StatusPill, inputClass,
} from "@/components/hkc/ui";
import { formatWhen, hoursLabel, money, ratingAverage } from "@/lib/hkc/domain";

export const Route = createFileRoute("/account")({
  component: Account,
  head: () => ({ meta: [{ title: "My requests" }] }),
});

interface ClientReferral {
  id: string; status: string; hours: number; hourly_rate_cents: number; estimate_cents: number;
  scheduled_at: string; address: string | null; city: string; service_type: string;
  access_notes?: string | null; unit?: string | null;
  decline_reason: string | null; cleaner_name: string; cleaner_email: string | null;
  cleaner_phone: string | null; cleaner_avatar: string | null; cleaner_rating_sum: number | null;
  cleaner_rating_count: number | null; review_stars: number | null;
}

function Account() {
  const [rows, setRows] = useState<ClientReferral[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    apiGet<{ referrals: ClientReferral[] }>("client")
      .then((d) => setRows(d.referrals))
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

  const open = (rows ?? []).filter((r) => r.status === "requested" || r.status === "accepted");
  const closed = (rows ?? []).filter((r) => !["requested", "accepted"].includes(r.status));

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
            My requests
          </h1>
          <button className="font-hk-body text-sm text-hk-muted underline-offset-4 hover:text-hk-ink hover:underline"
            onClick={() => apiPost("/api/auth", { action: "signout" }).then(() => { window.location.href = "/"; })}
            type="button">
            Sign out
          </button>
        </div>

        {error ? <div className="mt-8"><Notice tone="error">{error}</Notice></div> : null}
        {flash ? <div className="mt-8"><Notice tone="good">{flash}</Notice></div> : null}

        {rows === null ? (
          <div className="mt-12"><RowSkeleton /></div>
        ) : rows.length === 0 ? (
          <div className="mt-12">
            <EmptyState body="Browse the directory, pick the cleaner you want, and send them a request. Once they accept you get their contact details and arrange the rest directly."
              icon="house" title="No requests yet"
              action={<a className="rounded-full bg-hk-accent px-6 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep" href="/find">Find a cleaner</a>} />
          </div>
        ) : (
          <div className="mt-12 space-y-12">
            {[{ list: open, title: "Open" }, { list: closed, title: "Past" }]
              .filter((g) => g.list.length > 0)
              .map((group) => (
                <section key={group.title}>
                  <h2 className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-muted">{group.title}</h2>
                  <div className="mt-5 space-y-4">
                    {group.list.map((row) => (
                      <RequestCard busy={busyId === row.id} key={row.id} onAct={act} row={row} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function RequestCard({ busy, onAct, row }: {
  busy: boolean;
  onAct: (id: string, payload: Record<string, unknown>, message: string) => void;
  row: ClientReferral;
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [addr, setAddr] = useState({ accessNotes: "", address: "", unit: "" });
  const firstName = row.cleaner_name.split(" ")[0];

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill status={row.status} />
          <h3 className="mt-3 font-hk-display text-xl font-medium tracking-tight text-hk-ink">
            {formatWhen(row.scheduled_at)}
          </h3>
          <p className="mt-1 text-sm text-hk-muted">
            {row.address ? `${row.address}, ` : ""}{row.city} · {hoursLabel(row.hours)} ·{" "}
            {row.service_type === "commercial" ? "Office" : "Home"}
          </p>
        </div>
        <div className="text-right">
          <span className="hk-tabular block font-hk-display text-2xl font-semibold tracking-tighter text-hk-ink">
            {money(row.estimate_cents)}
          </span>
          <span className="font-hk-mono text-xs text-hk-muted">
            estimate at {money(row.hourly_rate_cents)}/hr
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-hk border border-hk-line bg-hk-ground p-4">
        <img alt="" aria-hidden="true" className="h-14 w-14 rounded-full object-cover" height={720}
          src={row.cleaner_avatar ?? "/assets/brand/mark.png"} onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback !== "1") { t.dataset.fallback = "1"; t.src = "/assets/brand/mark.png"; } }} width={720} />
        <div>
          <p className="font-hk-display text-base font-medium tracking-tight text-hk-ink">{row.cleaner_name}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-hk-muted">
            <Stars size={13} value={ratingAverage(row.cleaner_rating_sum ?? 0, row.cleaner_rating_count ?? 0)} />
            {row.cleaner_rating_count ? `${ratingAverage(row.cleaner_rating_sum ?? 0, row.cleaner_rating_count)} of 5` : "Not yet rated"}
          </p>
        </div>
      </div>

      {row.status === "requested" ? (
        <div className="mt-6 border-t border-hk-line pt-5">
          <p className="text-sm leading-relaxed text-hk-muted">
            Waiting on {firstName} to accept or decline. They are free to do either.
          </p>
          <button className="mt-4 rounded-hk border border-hk-line px-4 py-2.5 text-sm text-hk-muted transition-colors hover:border-hk-ink hover:text-hk-ink disabled:opacity-50"
            disabled={busy} onClick={() => onAct(row.id, { action: "cancel" }, "Request withdrawn.")}
            type="button">
            Withdraw request
          </button>
        </div>
      ) : null}

      {row.status === "accepted" ? (
        <div className="mt-6 space-y-4 border-t border-hk-line pt-5">
          <div className="rounded-hk border border-hk-accent bg-hk-accent-wash p-4">
            <p className="font-hk-display text-base font-medium text-hk-accent-deep">
              {firstName} accepted. Here is how to reach them.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-hk-accent-deep">
              {row.cleaner_email ? (
                <li className="flex items-center gap-2"><Icon name="key" size={15} /> {row.cleaner_email}</li>
              ) : null}
              {row.cleaner_phone ? (
                <li className="flex items-center gap-2"><Icon name="pin" size={15} /> {row.cleaner_phone}</li>
              ) : null}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-hk-accent-deep">
              Pay {firstName} directly at {money(row.hourly_rate_cents)} an hour. HomeKey Clean does
              not process this payment and does not take a cut of it.
            </p>
          </div>
          {!row.address ? (
            <div className="rounded-hk border border-hk-line bg-hk-paper p-5">
              <h4 className="font-hk-display text-base font-medium tracking-tight text-hk-ink">
                Now send {firstName} your address
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-hk-muted">
                They have accepted, so they can see this. Nobody else can.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address">
                    <input className={inputClass} onChange={(e) => setAddr((a) => ({ ...a, address: e.target.value }))}
                      value={addr.address} />
                  </Field>
                </div>
                <Field label="Unit or apartment" hint="Optional.">
                  <input className={inputClass} onChange={(e) => setAddr((a) => ({ ...a, unit: e.target.value }))}
                    value={addr.unit} />
                </Field>
                <Field label="Getting in" hint="Lockbox code, doorman, where the key lives.">
                  <input className={inputClass} onChange={(e) => setAddr((a) => ({ ...a, accessNotes: e.target.value }))}
                    value={addr.accessNotes} />
                </Field>
              </div>
              <button className="mt-5 rounded-full bg-hk-accent px-6 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-60"
                disabled={busy || !addr.address.trim()}
                onClick={() => onAct(row.id, { action: "address", ...addr }, `Address sent to ${firstName}.`)}
                type="button">
                Send address to {firstName}
              </button>
            </div>
          ) : null}

          <button className="rounded-hk border border-hk-line px-4 py-2.5 text-sm text-hk-muted transition-colors hover:border-hk-ink hover:text-hk-ink disabled:opacity-50"
            disabled={busy} onClick={() => onAct(row.id, { action: "cancel" }, "Cancelled.")}
            type="button">
            Cancel this job
          </button>
        </div>
      ) : null}

      {row.status === "declined" ? (
        <div className="mt-6 border-t border-hk-line pt-5">
          <p className="text-sm leading-relaxed text-hk-muted">
            {firstName} declined{row.decline_reason ? `: ${row.decline_reason}` : "."} Plenty of other
            cleaners cover {row.city}.
          </p>
          <a className="mt-4 inline-block rounded-hk border border-hk-accent px-4 py-2.5 text-sm text-hk-accent transition-colors hover:bg-hk-accent hover:text-hk-ground" href="/find">
            Find someone else
          </a>
        </div>
      ) : null}

      {row.status === "completed" ? (
        <div className="mt-6 border-t border-hk-line pt-5">
          {row.review_stars ? (
            <p className="flex items-center gap-2 text-sm text-hk-muted">
              You rated this <Stars size={14} value={row.review_stars} />
            </p>
          ) : (
            <div>
              <p className="font-hk-display text-base font-medium text-hk-ink">How did {firstName} do?</p>
              <p className="mt-1 text-sm text-hk-muted">Ratings are how good cleaners get found.</p>
              <div className="mt-3"><StarPicker onChange={setStars} value={stars} /></div>
              <input className={`${inputClass} mt-3`} onChange={(e) => setComment(e.target.value)}
                placeholder="Anything worth saying" value={comment} />
              <button className="mt-3 rounded-full bg-hk-accent px-5 py-2.5 font-hk-display text-sm font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep disabled:opacity-50"
                disabled={busy} onClick={() => onAct(row.id, { action: "review", comment, stars }, "Thanks for rating.")}
                type="button">
                Submit rating
              </button>
            </div>
          )}
        </div>
      ) : null}
    </Panel>
  );
}
