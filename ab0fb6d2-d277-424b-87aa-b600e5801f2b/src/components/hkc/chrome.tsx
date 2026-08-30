import { useEffect, useState } from "react";

import { BookCta, Icon, NavCta } from "./ui";

export interface MeUser { id: string; email: string; name: string; role: string }
export interface MeCleaner {
  user_id: string; tier: number; status: string; rating_sum: number; rating_count: number;
  jobs_completed: number; payment_on_file: number; id_verified: number; background_check: number;
  headline: string | null; bio: string | null; areas: string | null; years_experience: number;
  earnings_released_cents: number; avatar: string | null;
  hourly_rate_cents: number; plan: string; accepting: number; specialties: string;
  fees_owed_cents: number;
}
export interface Me { cleaner: MeCleaner | null; user: MeUser | null }

export async function apiGet<T>(scope: string): Promise<T> {
  const res = await fetch(`/api/data?scope=${scope}`, { credentials: "same-origin" });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong");
  return body;
}

export async function apiPost<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(path, {
    body: JSON.stringify(payload),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? "Something went wrong");
  return body;
}

/** Client-side session read. SSR renders the signed out chrome, then this fills in. */
export function useMe(): { me: Me | null; loading: boolean } {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch("/api/auth", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: Me) => { if (live) { setMe(d); setLoading(false); } })
      .catch(() => { if (live) { setMe({ cleaner: null, user: null }); setLoading(false); } });
    return () => { live = false; };
  }, []);
  return { loading, me };
}

export function Wordmark({ tone = "ink" }: { tone?: "ink" | "ground" }) {
  return (
    <a className="inline-flex items-center gap-2.5" href="/">
      <img alt="" aria-hidden="true" height={30} src="/assets/brand/mark.png" width={30} />
      <span className={`font-hk-display text-lg font-semibold tracking-tight ${tone === "ink" ? "text-hk-ink" : "text-hk-ground"}`}>
        HomeKey Clean
      </span>
    </a>
  );
}

const NAV_LINKS = [
  { href: "/find", label: "Find a cleaner" },
  { href: "/match", label: "Match me" },
  { href: "/#how", label: "How it works" },
  { href: "/#coverage", label: "Coverage" },
  { href: "/blog", label: "Guides" },
  { href: "/cleaners", label: "For cleaners" },
];

export function SiteNav() {
  const { loading, me } = useMe();
  const signedIn = Boolean(me?.user);
  const isCleaner = me?.user?.role === "cleaner";
  return (
    <header className="sticky top-0 z-50 border-b border-hk-line/70 bg-hk-ground/92 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-6 px-5">
        <Wordmark />
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a className="font-hk-body text-sm text-hk-muted transition-colors hover:text-hk-ink" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="h-9 w-20 animate-pulse rounded-full bg-hk-line" />
          ) : signedIn ? (
            <NavCta href={isCleaner ? "/work" : "/account"} label={isCleaner ? "My referrals" : "My requests"} />
          ) : (
            <NavCta href="/signin" label="Sign in" />
          )}
          <span className="hidden sm:inline-block"><BookCta /></span>
        </div>
      </nav>
    </header>
  );
}

const FOOTER_COLUMNS = [
  { links: [{ href: "/find", label: "Find a cleaner" }, { href: "/#how", label: "How it works" }, { href: "/blog", label: "Guides" }, { href: "/account", label: "My requests" }], title: "For clients" },
  { links: [{ href: "/cleaners", label: "Join the directory" }, { href: "/cleaners#plans", label: "Plans and fees" }, { href: "/work", label: "My referrals" }, { href: "/signin", label: "Sign in" }], title: "For cleaners" },
  { links: [{ href: "/#coverage", label: "Los Angeles County" }, { href: "/#coverage", label: "Orange County" }, { href: "/find", label: "Commercial cleaning" }], title: "Where we work" },
  { links: [{ href: "/#questions", label: "Common questions" }, { href: "mailto:hello@homekeyclean.com", label: "hello@homekeyclean.com" }], title: "Company" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hk-line bg-hk-paper">
      <div className="mx-auto max-w-[1180px] px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Wordmark />
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-hk-muted">
              A referral agency for independent cleaners. Los Angeles and Orange County.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="font-hk-mono text-xs uppercase tracking-[0.14em] text-hk-muted">{column.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a className="text-sm text-hk-ink transition-colors hover:text-hk-accent" href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-hk-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-hk-mono text-xs uppercase tracking-[0.12em] text-hk-muted">
            HomeKey Clean, Los Angeles CA
          </p>
          <p className="flex items-center gap-2 text-sm text-hk-muted">
            <Icon name="shield" size={16} />
            Identity checked, background checked, independently licensed
          </p>
        </div>
      </div>
    </footer>
  );
}
