import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter, SiteNav } from "@/components/hkc/chrome";
import { Hero } from "@/components/hkc/hero";
import { BookCta, ChapterCta, Icon, type IconName } from "@/components/hkc/ui";
import { COVERAGE, DISCLOSURE_CLIENT, PLANS, money } from "@/lib/hkc/domain";

export const Route = createFileRoute("/")({ component: Index });

const STEPS = [
  { art: "/assets/steps/step-1.png", body: "Filter by city and speciality. Every listing shows the rate that cleaner set themselves.", label: "01", title: "Browse the directory" },
  { art: "/assets/steps/step-2.png", body: "Pick the person you want and send them the job: address, hours, date, and any extras.", label: "02", title: "Request someone" },
  { art: "/assets/steps/step-4.png", body: "They accept or decline. If they accept, you get their phone number and email.", label: "03", title: "They reply" },
  { art: "/assets/steps/step-5.png", body: "Pay the cleaner directly at their rate. We never touch the money, and we never take a cut.", label: "04", title: "Pay them directly" },
];

const VOICES = [
  { body: "I could see her rate, her neighbourhoods, and what she specialises in before I ever messaged her. That is the whole thing I wanted and could never find.", name: "Rachel M.", photo: "/assets/people/voice-1.jpg", place: "Mar Vista" },
  { body: "I pay my cleaner the same way I pay my gardener. She names her price, I pay her, and nobody skims it on the way through.", name: "Anil S.", photo: "/assets/people/voice-2.jpg", place: "Irvine" },
];

const QUESTIONS = [
  { a: "Yes. That is the point of a referral agency. You browse the directory, read profiles, compare the rates each cleaner sets, and request the specific person you want.", q: "Do I get to choose my cleaner?" },
  { a: "The cleaner does. Every person in the directory is an independent business who publishes their own hourly rate. We do not set it, suggest it, or take a percentage of it.", q: "Who decides the price?" },
  { a: "Nothing. Clients pay HomeKey Clean no fee at all. Our income comes from cleaners who pay for a listing in the directory.", q: "What does HomeKey Clean charge me?" },
  { a: "Directly to the cleaner, however the two of you agree. There is no checkout here, no escrow, and no card on file. We introduce you and then step out of the way.", q: "How do I pay for the clean?" },
  { a: "No. Cleaners are independent businesses, not our employees and not yours by default. Depending on how you arrange the work you may have obligations as a household employer, which is worth a conversation with your accountant.", q: "Is the cleaner your employee?" },
  { a: "They are free to decline, and they will tell you why when they do. The directory has plenty of other cleaners covering the same neighbourhoods, so you request someone else.", q: "What if the cleaner says no?" },
  { a: "Every listed cleaner has passed identity verification and a background check, and has a business licence on file. We verify before a profile goes live in the directory.", q: "How are cleaners vetted?" },
];

function Index() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />

        <section className="border-b border-hk-line bg-hk-ground py-24" id="how">
          <div className="mx-auto max-w-[1180px] px-5">
            <h2 className="hk-reveal max-w-[18ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
              An introduction, not a middleman
            </h2>
            <p className="hk-reveal mt-5 max-w-[62ch] text-base leading-relaxed text-hk-muted">
              Most cleaning platforms sit between you and the person doing the work, setting the
              price and taking a cut of it. We just make the introduction.
            </p>
            <div className="hk-reveal-rule mt-10 h-px w-full bg-hk-line" />
            <ol className="hk-stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <li className="hk-card rounded-hk-lg border border-hk-line bg-hk-paper p-6" key={step.label}>
                  <div className="hk-card-media rounded-hk bg-hk-ground">
                    <img alt="" aria-hidden="true" className="h-auto w-full" height={520}
                      loading="lazy" src={step.art} width={520} />
                  </div>
                  <span className="mt-5 block font-hk-mono text-xs tracking-[0.16em] text-hk-accent">{step.label}</span>
                  <h3 className="mt-2 font-hk-display text-xl font-medium leading-snug tracking-tight text-hk-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-hk-muted">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="hk-reveal mt-12 flex flex-wrap items-center gap-8">
              <BookCta />
              <ChapterCta href="#pricing" label="What it costs" />
            </div>
          </div>
        </section>

        <section className="border-b border-hk-line bg-hk-paper py-24" id="pricing">
          <div className="mx-auto max-w-[1180px] px-5">
            <span className="hk-reveal font-hk-mono text-xs uppercase tracking-[0.18em] text-hk-accent">What it costs</span>
            <h2 className="hk-reveal mt-4 max-w-[16ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
              Clients pay us nothing
            </h2>
            <p className="hk-reveal mt-5 max-w-[62ch] text-base leading-relaxed text-hk-muted">
              You pay your cleaner their hourly rate and that is the end of it. There is no service
              fee, no booking fee, and no markup, because we are not selling you cleaning.
            </p>
            <div className="hk-stagger mt-14 grid gap-5 lg:grid-cols-3">
              <div className="hk-card rounded-hk-lg border border-hk-accent bg-hk-accent-wash p-8">
                <span className="font-hk-mono text-xs uppercase tracking-[0.12em] text-hk-accent-deep">If you are a client</span>
                <p className="hk-tabular mt-5 font-hk-display text-6xl font-semibold leading-none tracking-tighter text-hk-accent">
                  $0
                </p>
                <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-hk-accent-deep">
                  No fee to browse, no fee to request, no fee when they accept. You pay only the
                  cleaner, at the rate shown on their profile.
                </p>
              </div>
              {PLANS.map((plan) => (
                <div className="hk-card rounded-hk-lg border border-hk-line bg-hk-ground p-8" key={plan.id}>
                  <span className="font-hk-mono text-xs uppercase tracking-[0.12em] text-hk-muted">
                    Cleaner plan, {plan.name}
                  </span>
                  <p className="hk-tabular mt-5 font-hk-display text-6xl font-semibold leading-none tracking-tighter text-hk-ink">
                    {plan.monthlyCents === 0 ? "Free" : money(plan.monthlyCents)}
                    {plan.monthlyCents > 0 ? <span className="font-hk-mono text-sm font-normal text-hk-muted">/mo</span> : null}
                  </p>
                  <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-hk-muted">{plan.blurb}</p>
                  <ul className="mt-5 space-y-2 border-t border-hk-line pt-5">
                    {plan.perks.slice(0, 3).map((perk) => (
                      <li className="flex gap-2.5 text-sm text-hk-ink" key={perk}>
                        <Icon className="mt-0.5 shrink-0" name="shield" size={15} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="hk-reveal mt-12">
              <ChapterCta href="/cleaners" label="Full plan details for cleaners" />
            </div>
          </div>
        </section>

        <section className="border-b border-hk-line bg-hk-ground py-24" id="coverage">
          <div className="mx-auto grid max-w-[1180px] gap-14 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="hk-reveal-side">
              <h2 className="max-w-[14ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
                Two counties, for now
              </h2>
              <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-hk-muted">
                We are building a deep roster in Los Angeles and Orange County before we go
                anywhere else. A directory only works when there is someone good near you.
              </p>
              <div className="mt-8 flex gap-4">
                <Icon className="mt-0.5 shrink-0" name="building" size={26} />
                <div>
                  <h3 className="font-hk-display text-base font-medium tracking-tight text-hk-ink">Offices too</h3>
                  <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-hk-muted">
                    Filter the directory to cleaners who take commercial work and request them the
                    same way.
                  </p>
                </div>
              </div>
              <div className="hk-card hk-card-media mt-8 rounded-hk-lg">
                <img alt="An empty modern office at dawn, freshly cleaned"
                  className="w-full object-cover" height={420} loading="lazy"
                  src="/assets/brand/commercial.jpg" width={745} />
              </div>
            </div>
            <div className="hk-stagger grid gap-8 sm:grid-cols-2">
              {COVERAGE.map((group) => (
                <div key={group.county}>
                  <div className="flex items-center gap-2 border-b border-hk-line pb-3">
                    <Icon name="pin" size={18} />
                    <h3 className="font-hk-display text-base font-medium tracking-tight text-hk-ink">{group.county}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {group.cities.map((city) => (
                      <li className="text-sm text-hk-muted transition-colors hover:text-hk-ink" key={city}>{city}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-hk-line bg-hk-paper py-24" id="cleaners">
          <div className="mx-auto max-w-[1180px] px-5">
            <span className="hk-reveal font-hk-mono text-xs uppercase tracking-[0.18em] text-hk-accent">For cleaners</span>
            <div className="mt-4 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <h2 className="hk-reveal max-w-[17ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
                Your rate. Your clients. Your business.
              </h2>
              <p className="hk-reveal text-base leading-relaxed text-hk-muted">
                Nobody here works for us. Cleaners publish their own rate, accept the jobs they want,
                keep their own clients, and trade under their own name.
              </p>
            </div>
            <div className="hk-stagger mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { alt: "Marisol, an independent cleaner", src: "/assets/people/cleaner-1.jpg" },
                { alt: "Diego, an independent cleaner", src: "/assets/people/cleaner-5.jpg" },
                { alt: "Irena, an independent cleaner", src: "/assets/people/cleaner-6.jpg" },
              ].map((photo) => (
                <div className="hk-card hk-card-media rounded-hk-lg" key={photo.src}>
                  <img alt={photo.alt} className="h-72 w-full object-cover" height={900}
                    loading="lazy" src={photo.src} width={720} />
                </div>
              ))}
            </div>
            <div className="hk-stagger mt-5 grid gap-5 sm:grid-cols-3">
              {([
                { body: "You publish the number. We never set it and never take a percentage of it.", icon: "wallet", title: "You set the rate" },
                { body: "Every request names the client, the address, the hours. Say yes or no freely.", icon: "key", title: "You choose the work" },
                { body: "Identity, background, and business licence checked before a listing goes live.", icon: "shield", title: "Everyone is vetted" },
              ] as { body: string; icon: IconName; title: string }[]).map((item) => (
                <div className="hk-card rounded-hk-lg border border-hk-line bg-hk-ground p-7" key={item.title}>
                  <Icon name={item.icon} size={28} />
                  <h3 className="mt-4 font-hk-display text-lg font-medium tracking-tight text-hk-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-hk-muted">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="hk-reveal mt-12">
              <a className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-hk-ink px-7 py-3.5 font-hk-display text-base font-medium text-hk-ink transition-colors duration-300 hover:text-hk-ground"
                href="/cleaners">
                <span aria-hidden="true" className="absolute inset-0 origin-bottom scale-y-0 bg-hk-ink transition-transform duration-400 ease-out group-hover:scale-y-100" />
                <span className="relative">Join the directory</span>
              </a>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-hk-line py-24">
          <div aria-hidden="true" className="absolute inset-0 opacity-70"
            style={{ backgroundImage: "url(/assets/brand/pattern.png)", backgroundRepeat: "repeat", backgroundSize: "300px" }} />
          <div aria-hidden="true" className="absolute inset-0">
            <img alt="" className="h-full w-full object-cover opacity-45" height={900} loading="lazy"
              src="/assets/brand/plate.jpg" width={1600} />
          </div>
          <div className="hk-stagger relative mx-auto grid max-w-[1180px] gap-12 px-5 md:grid-cols-2">
            {VOICES.map((voice) => (
              <figure key={voice.name}>
                <blockquote className="font-hk-display text-2xl font-medium leading-snug tracking-tight text-hk-ink md:text-3xl">
                  {voice.body}
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3.5">
                  <img alt="" aria-hidden="true" className="h-12 w-12 rounded-full object-cover"
                    height={400} loading="lazy" src={voice.photo} width={400} />
                  <span className="text-sm text-hk-muted">
                    <strong className="block font-hk-display font-medium text-hk-ink">{voice.name}</strong>
                    {voice.place}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-hk-paper py-24" id="questions">
          <div className="mx-auto max-w-[1180px] px-5">
            <span className="hk-reveal font-hk-mono text-xs uppercase tracking-[0.18em] text-hk-accent">Questions</span>
            <h2 className="hk-reveal mt-4 max-w-[16ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
              The parts people ask about
            </h2>
            <div className="hk-stagger mt-12 divide-y divide-hk-line border-y border-hk-line">
              {QUESTIONS.map((item, i) => (
                <details className="group py-6" key={item.q} open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                    <span className="font-hk-display text-lg font-medium tracking-tight text-hk-ink transition-colors group-hover:text-hk-accent">
                      {item.q}
                    </span>
                    <Icon className="shrink-0 transition-transform duration-300 group-open:rotate-90" name="key" size={20} />
                  </summary>
                  <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-hk-muted">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-10 rounded-hk-lg border border-hk-line bg-hk-ground p-7">
              <h3 className="font-hk-display text-base font-medium tracking-tight text-hk-ink">
                How this relationship works
              </h3>
              <p className="mt-3 max-w-[74ch] text-sm leading-relaxed text-hk-muted">{DISCLOSURE_CLIENT}</p>
            </div>
            <div className="hk-reveal mt-14 flex flex-wrap items-center gap-8">
              <BookCta />
              <ChapterCta href="/cleaners" label="List yourself as a cleaner" />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
