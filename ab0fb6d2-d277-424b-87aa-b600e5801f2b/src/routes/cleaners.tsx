import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter, SiteNav, useMe } from "@/components/hkc/chrome";
import { Icon, Notice, Panel, type IconName } from "@/components/hkc/ui";
import { DISCLOSURE_CLEANER, PLANS, money } from "@/lib/hkc/domain";

export const Route = createFileRoute("/cleaners")({
  component: Cleaners,
  head: () => ({ meta: [{ title: "Get referrals from HomeKey Clean" }] }),
});

const PROMISES: { body: string; icon: IconName; title: string }[] = [
  { body: "You publish your own hourly rate. We never set it, never suggest it, and never take a percentage of it.", icon: "wallet", title: "Your rate, your number" },
  { body: "Clients pay you directly. No escrow, no waiting on a platform to release your money.", icon: "key", title: "Paid straight by the client" },
  { body: "Every request comes with the address, the hours, and the client's name. Accept the ones you want.", icon: "shield", title: "Accept or decline freely" },
  { body: "Keep your own clients, work for other agencies, use your own supplies, and trade under your own name.", icon: "house", title: "It stays your business" },
];

const STEPS = [
  { art: "/assets/steps/step-1.png", body: "Rate, neighbourhoods, specialities, and a line about your work.", title: "Build your listing" },
  { art: "/assets/steps/step-2.png", body: "Identity check, background check, and your business licence on file.", title: "Pass the checks" },
  { art: "/assets/steps/step-4.png", body: "Clients browse the directory and request you by name.", title: "Get requests" },
  { art: "/assets/steps/step-5.png", body: "Accept the work you want, do the job, get paid by the client.", title: "Do the work" },
];

function Cleaners() {
  const { loading, me } = useMe();
  const isCleaner = Boolean(me?.cleaner);

  return (
    <>
      <SiteNav />
      <main>
        <section className="border-b border-hk-line bg-hk-paper py-20">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h1 className="max-w-[16ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
                We find you clients. You keep your business.
              </h1>
              <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-hk-muted">
                HomeKey Clean is a referral agency, not a cleaning company and not your employer.
                You set your rate, you choose your jobs, and the client pays you.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a className="rounded-full bg-hk-accent px-7 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep"
                  href={isCleaner ? "/work#profile" : "/signin"}>
                  {isCleaner ? "Edit my listing" : "Join the directory"}
                </a>
                <a className="rounded-full border border-hk-ink/25 px-7 py-3.5 font-hk-display text-base font-medium text-hk-ink transition-colors hover:bg-hk-ink hover:text-hk-ground" href="#plans">
                  See the plans
                </a>
              </div>
            </div>
            <img alt="Danielle, an independent cleaner listed with HomeKey Clean"
              className="w-full rounded-hk-lg object-cover" height={900}
              src="/assets/people/cleaner-2.jpg" width={720} />
          </div>
        </section>

        <section className="border-b border-hk-line bg-hk-ground py-20">
          <div className="mx-auto max-w-[1180px] px-5">
            <div className="hk-stagger grid gap-10 md:grid-cols-2">
              {PROMISES.map((promise) => (
                <div className="flex gap-5" key={promise.title}>
                  <Icon className="mt-1 shrink-0" name={promise.icon} size={30} />
                  <div>
                    <h2 className="font-hk-display text-xl font-medium tracking-tight text-hk-ink">{promise.title}</h2>
                    <p className="mt-2 max-w-[46ch] text-base leading-relaxed text-hk-muted">{promise.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <ol className="hk-stagger mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li className="hk-card rounded-hk-lg border border-hk-line bg-hk-paper p-5" key={step.title}>
                  <div className="hk-card-media rounded-hk bg-hk-ground">
                    <img alt="" aria-hidden="true" className="h-auto w-full" height={520}
                      loading="lazy" src={step.art} width={520} />
                  </div>
                  <span className="mt-5 block font-hk-mono text-xs tracking-[0.16em] text-hk-accent">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-hk-display text-lg font-medium tracking-tight text-hk-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-hk-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-hk-paper py-20" id="plans">
          <div className="mx-auto max-w-[1180px] px-5">
            <span className="hk-reveal font-hk-mono text-xs uppercase tracking-[0.18em] text-hk-accent">Plans</span>
            <h2 className="hk-reveal mt-4 max-w-[18ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
              You pay us, never the client
            </h2>
            <p className="hk-reveal mt-5 max-w-[58ch] text-base leading-relaxed text-hk-muted">
              Clients pay nothing to HomeKey Clean. Our whole income is what cleaners pay for access
              to the directory, so pick whichever plan suits how much work you want.
            </p>
            <div className="hk-stagger mt-12 grid gap-5 md:grid-cols-2">
              {PLANS.map((plan) => (
                <div className={`hk-card rounded-hk-lg border p-8 ${plan.id === "pro" ? "border-hk-accent bg-hk-accent-wash" : "border-hk-line bg-hk-ground"}`} key={plan.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-hk-display text-2xl font-medium tracking-tight text-hk-ink">{plan.name}</h3>
                    <span className="hk-tabular font-hk-display text-4xl font-semibold tracking-tighter text-hk-accent">
                      {plan.monthlyCents === 0 ? "Free" : money(plan.monthlyCents)}
                      {plan.monthlyCents > 0 ? <span className="font-hk-mono text-sm font-normal text-hk-muted">/mo</span> : null}
                    </span>
                  </div>
                  <p className="mt-3 text-base text-hk-muted">{plan.blurb}</p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.perks.map((perk) => (
                      <li className="flex gap-3 text-base text-hk-ink" key={perk}>
                        <Icon className="mt-0.5 shrink-0" name="shield" size={18} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-12 max-w-[70ch]">
              {loading ? null : !me?.user ? (
                <Notice>
                  Ready to be listed? <a className="underline" href="/signin">Create a cleaner account</a>,
                  choose Take jobs when you sign up, and your listing editor appears.
                </Notice>
              ) : isCleaner ? (
                <Notice tone="good">
                  You have a cleaner account. <a className="underline" href="/work#profile">Edit your listing</a> to
                  set your rate and go live in the directory.
                </Notice>
              ) : (
                <Notice tone="error">
                  This is a client account. Sign out and create a cleaner account to be listed.
                </Notice>
              )}
            </div>

            <Panel className="mt-8">
              <h3 className="font-hk-display text-lg font-medium tracking-tight text-hk-ink">
                What this relationship is
              </h3>
              <p className="mt-3 max-w-[74ch] text-sm leading-relaxed text-hk-muted">{DISCLOSURE_CLEANER}</p>
            </Panel>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
