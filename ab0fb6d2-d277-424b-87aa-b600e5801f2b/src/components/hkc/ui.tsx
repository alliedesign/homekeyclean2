import { useId, type ReactNode } from "react";

/* ---------------- generated icon set ---------------- */

const ICON_INDEX = {
  building: 3, calendar: 4, clock: 5, house: 2, key: 0, pin: 10,
  shield: 8, sparkle: 11, spray: 6, star: 1, towels: 7, wallet: 9,
} as const;

export type IconName = keyof typeof ICON_INDEX;

export function Icon({ className, name, size = 24 }: { className?: string; name: IconName; size?: number }) {
  return (
    <img aria-hidden="true" alt="" className={className} height={size}
      src={`/assets/icons/icon-${ICON_INDEX[name]}.png`} width={size} />
  );
}

/* ---------------- rating ---------------- */

/* icon-1.png is an OUTLINE star, so the old opacity trick could not show a
   filled state -- a 4.9 rating rounded to 5 and rendered five identical hollow
   stars, i.e. it looked like a zero. These are real filled shapes, and they
   fill fractionally so 4.9 reads as 4.9 rather than rounding up to 5. */
const STAR_PATH =
  "M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.4l-5.8 3.06 1.11-6.46-4.7-4.58 6.49-.94L12 2.6z";

export function Stars({ size = 15, value }: { size?: number; value: number }) {
  const uid = useId();
  const rating = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
  return (
    <span className="inline-flex items-center gap-[3px] text-hk-accent" role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        const gid = `${uid}-star-${i}`;
        return (
          <svg aria-hidden="true" focusable="false" height={size} key={i}
            viewBox="0 0 24 24" width={size}>
            {fill > 0 && fill < 1 && (
              <defs>
                <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
                  <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                  <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
            )}
            <path d={STAR_PATH} fill={fill >= 1 ? "currentColor" : fill > 0 ? `url(#${gid})` : "none"}
              stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"
              strokeOpacity={fill >= 1 ? 1 : 0.45} />
          </svg>
        );
      })}
    </span>
  );
}

export function StarPicker({ onChange, value }: { onChange: (n: number) => void; value: number }) {
  return (
    <div className="inline-flex items-center gap-1 text-hk-accent">
      {[1, 2, 3, 4, 5].map((n) => (
        <button aria-label={`${n} star${n === 1 ? "" : "s"}`} key={n} onClick={() => onChange(n)}
          className="rounded-md p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
          type="button">
          <svg aria-hidden="true" focusable="false" height={26} viewBox="0 0 24 24" width={26}>
            <path d={STAR_PATH} fill={n <= value ? "currentColor" : "none"}
              stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"
              strokeOpacity={n <= value ? 1 : 0.45} />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ------- CTA inventory: five garments, each its own interaction identity ------- */

export function BookCta({ href = "/find", label = "Find a cleaner" }: { href?: string; label?: string }) {
  return (
    <a className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-hk-accent px-7 py-3.5 font-hk-display text-base font-medium tracking-tight text-hk-ground transition-transform duration-200 active:scale-[0.98]"
      href={href}>
      <span aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-hk-accent-deep transition-transform duration-400 ease-out group-hover:translate-x-0" />
      <span className="relative">{label}</span>
      <span aria-hidden="true" className="relative transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
    </a>
  );
}

export function CleanerCta({ href = "/cleaners", label = "Get referrals" }: { href?: string; label?: string }) {
  return (
    <a className="group relative inline-flex flex-col items-start font-hk-display text-base font-medium tracking-tight text-hk-ink"
      href={href}>
      <span>{label}</span>
      <span aria-hidden="true"
        className="mt-1 block h-px w-full origin-left scale-x-0 bg-hk-ink transition-transform duration-400 ease-out group-hover:scale-x-100" />
    </a>
  );
}

export function ChapterCta({ href, label }: { href: string; label: string }) {
  return (
    <a className="group inline-flex items-center gap-2 font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-accent"
      href={href}>
      <Icon className="transition-transform duration-300 group-hover:rotate-90" name="key" size={15} />
      <span className="border-b border-transparent pb-0.5 transition-colors duration-200 group-hover:border-hk-accent">{label}</span>
    </a>
  );
}

export function ClaimCta({ busy, label = "Accept", onClick }: { busy?: boolean; label?: string; onClick: () => void }) {
  return (
    <button className="group relative isolate overflow-hidden rounded-[6px] border border-hk-accent px-5 py-2.5 font-hk-display text-sm font-medium text-hk-accent transition-colors duration-300 hover:text-hk-ground disabled:opacity-50"
      disabled={busy} onClick={onClick} type="button">
      <span aria-hidden="true"
        className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-hk-accent transition-transform duration-300 ease-out group-hover:scale-y-100" />
      {busy ? "Working" : label}
    </button>
  );
}

export function NavCta({ href, label }: { href: string; label: string }) {
  return (
    <a className="rounded-full border border-hk-ink/25 px-4 py-2 font-hk-display text-sm font-medium text-hk-ink transition-colors duration-200 hover:border-hk-ink hover:bg-hk-ink hover:text-hk-ground"
      href={href}>
      {label}
    </a>
  );
}

/* ---------------- surfaces ---------------- */

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-hk-lg border border-hk-line bg-hk-paper p-6 ${className}`}>{children}</div>;
}

export function Field({ children, error, hint, label }: { children: ReactNode; error?: string; hint?: string; label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-hk-display text-sm font-medium text-hk-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-hk-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-hk-accent-deep">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-hk border border-hk-line bg-hk-ground px-3.5 py-2.5 text-base text-hk-ink outline-none transition-colors placeholder:text-hk-muted focus:border-hk-accent";

const STATUS_COPY: Record<string, string> = {
  accepted: "Accepted", cancelled: "Cancelled", completed: "Completed",
  declined: "Declined", requested: "Awaiting reply",
};

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "completed" ? "bg-hk-accent-wash text-hk-accent-deep"
      : status === "accepted" ? "bg-hk-ink text-hk-ground"
        : status === "cancelled" || status === "declined" ? "bg-hk-line text-hk-muted"
          : "border border-hk-line bg-hk-ground text-hk-muted";
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-hk-mono text-xs uppercase tracking-[0.1em] ${tone}`}>
      {STATUS_COPY[status] ?? status}
    </span>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "error" | "info" | "good" }) {
  const cls = tone === "error" ? "border-hk-accent-deep/40 bg-hk-accent-wash text-hk-accent-deep"
    : tone === "good" ? "border-hk-accent/40 bg-hk-accent-wash text-hk-accent-deep"
      : "border-hk-line bg-hk-ground text-hk-muted";
  return <p className={`rounded-hk border px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

export function EmptyState({ action, body, icon, title }: { action?: ReactNode; body: string; icon: IconName; title: string }) {
  return (
    <div className="rounded-hk-lg border border-dashed border-hk-line bg-hk-ground px-6 py-14 text-center">
      <Icon className="mx-auto opacity-45" name={icon} size={40} />
      <h3 className="mt-4 font-hk-display text-xl font-medium tracking-tight text-hk-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-hk-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="rounded-hk-lg border border-hk-line bg-hk-paper p-6" key={i}>
          <div className="h-3 w-28 animate-pulse rounded bg-hk-line" />
          <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-hk-line" />
          <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-hk-line" />
        </div>
      ))}
    </div>
  );
}
