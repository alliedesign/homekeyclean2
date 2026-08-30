# GoHighLevel workflow build specs — HomeKey Clean

Location: **Home Key Clean** · `BXz5kW0geHS3wDQQvvuA`

## Why these are specs and not built

GHL's public API exposes exactly one workflow operation — `get-workflow`, read-only.
There is no create endpoint. Workflows can only be built in the workflow builder,
by hand. Anything claiming to automate their creation is driving a browser.

So: below is every trigger, condition, wait and message, written to be typed
straight in. The one thing I *can* automate is the layer underneath — getting
your app's events into GHL — and that code is in `ghl-sync.ts`.

---

## 0. The integration layer (build this first)

Workflows need to know when something happens on the site. The reliable pattern
is **tag-driven**: your app upserts the contact and adds a tag; the workflow
triggers on that tag.

Don't trigger workflows off inbound webhooks directly. Tags are idempotent,
visible in the contact record, and let you re-run a sequence by hand when
something goes wrong. Webhook triggers are invisible and unrepeatable.

Tags your app will set:

| tag | set when |
|---|---|
| `hkc-cleaner-signup` | cleaner account created |
| `hkc-cleaner-profile-incomplete` | 24h after signup, listing still `pending` |
| `hkc-cleaner-live` | listing goes `active` (exit condition) |
| `hkc-booking-created` | booking inserted |
| `hkc-booking-complete` | booking marked complete |
| `hkc-lead-browsed` | viewed 2+ cleaner profiles, no booking |
| `hkc-payment-failed` | subscription or fee charge declined |
| `hkc-payment-recovered` | card updated and charge succeeds (exit condition) |

**Before you send a single SMS:** you need express written consent from that
person for marketing texts, captured and logged. Transactional messages about a
booking they made are a different category from promotional ones, and workflow 3
below is squarely promotional. Your old schema had `sms_opt_in` and
`marketing_consent_at` columns; the current one doesn't. Add them back and gate
every SMS step on them, or run these four workflows email-only. This is the kind
of thing that turns into statutory damages per message, so it's worth getting
right before launch rather than after.

---

## 1. Cleaner onboarding

**Goal:** turn a signup into a live, paying listing. Most cleaners stall after
creating an account, and a stalled listing earns nobody anything.

**Trigger:** Contact Tag Added → `hkc-cleaner-signup`

**Exit condition (set on the workflow, not as a step):** tag `hkc-cleaner-live`
is added. Nothing below should fire at someone who has already finished.

| # | step | detail |
|---|---|---|
| 1 | Email — immediate | Subject: **You're in. Three things to finish your listing.** Body: welcome, then the three blockers in order — rate + areas, ID and background check, card on file. One CTA to `/work#profile`. |
| 2 | Wait | 1 day |
| 3 | If/Else | Has tag `hkc-cleaner-live`? → **Yes:** exit. **No:** continue. |
| 4 | Email | Subject: **Your listing isn't visible yet** Body: name the specific thing that's missing. Explain plainly that clients only see `active` listings, so an incomplete profile earns nothing. CTA to `/work#profile`. |
| 5 | Wait | 3 days |
| 6 | If/Else | Has tag `hkc-cleaner-live`? → Yes: exit. No: continue. |
| 7 | Email | Subject: **Anything blocking you?** Body: short, human, ask what's stopping them. Reply-to a real inbox. This one is a conversation opener, not a nag — it's where you learn what your onboarding is getting wrong. |
| 8 | Wait | 7 days |
| 9 | If/Else | Still not live? → add tag `hkc-cleaner-dormant`, remove from sequence. |

**Don't** add a fourth and fifth chase. Three touches over eleven days is the
point where more emails stop converting and start generating spam complaints,
which damages deliverability for the sequences that do work.

---

## 2. Client booking follow-up

**Goal:** the booking happens, and it produces a review. Your directory sorts on
`rating_sum / rating_count`, so reviews are what make good cleaners findable —
this workflow is the engine behind the whole ranking.

**Trigger:** Contact Tag Added → `hkc-booking-created`

| # | step | detail |
|---|---|---|
| 1 | Email — immediate | Subject: **Your cleaner is confirmed** Body: cleaner name, date, time, and what to have ready. Restate the money clearly: *you pay your cleaner directly, we take no commission.* |
| 2 | Wait until | 1 day before `{{booking.scheduled_at}}`, 9:00am local |
| 3 | SMS *(consent-gated)* | "Hi {{contact.first_name}} — {{cleaner.name}} is booked for tomorrow at {{booking.time}}. Reply here if anything's changed." |
| 4 | Wait until | 3 hours after `{{booking.scheduled_at}}` |
| 5 | If/Else | Has tag `hkc-booking-complete`? → No: exit quietly (do not chase a job that didn't happen). Yes: continue. |
| 6 | Email | Subject: **How did it go?** Body: one-click star rating linking to `/account`. Keep it to two sentences — review requests convert on brevity. |
| 7 | Wait | 2 days |
| 8 | If/Else | Review submitted? → Yes: exit. No: one reminder, then exit. |

**Timing note:** step 4 waits three hours after the *scheduled* time, not the
completion time. Ask while it's fresh but after they've seen the finished work.
Asking the next morning measurably reduces response rates.

---

## 3. Lead nurture from the site

**Goal:** someone browsed cleaners and didn't book. This is the only promotional
sequence of the four, so it's the one that needs consent handled properly.

**Trigger:** Contact Tag Added → `hkc-lead-browsed`

**Exit condition:** tag `hkc-booking-created`.

| # | step | detail |
|---|---|---|
| 1 | Wait | 4 hours (don't email someone who is still on the site) |
| 2 | Email | Subject: **Still looking for a cleaner?** Body: link the two or three profiles they actually viewed. Personal beats generic here by a wide margin. |
| 3 | Wait | 2 days |
| 4 | Email | Subject: **What house cleaning actually costs here** Body: link `/blog/house-cleaning-cost-los-angeles`. Lead with the useful thing, not the ask. |
| 5 | Wait | 3 days |
| 6 | Email | Subject: **Questions worth asking before you book** Body: link `/blog/what-to-ask-before-hiring-a-cleaner`, then a soft CTA to `/find`. |
| 7 | Wait | 5 days |
| 8 | If/Else | Opened any of the three? → **No:** add tag `hkc-lead-cold` and stop emailing. **Yes:** move to a monthly newsletter list. |

Step 8 matters more than it looks. Continuing to mail people who never open is
the fastest way to poison your sending domain, and it takes months to recover.

---

## 4. Failed payment recovery

**Goal:** get the card updated before the listing goes dark. This is the highest
ROI of the four — you are recovering revenue you have already earned.

**Trigger:** Contact Tag Added → `hkc-payment-failed`

**Exit condition:** tag `hkc-payment-recovered`.

| # | step | detail |
|---|---|---|
| 1 | Email — immediate | Subject: **Your card was declined** Body: state plainly what failed and what happens if it isn't fixed. One CTA to the Stripe billing portal (`/api/stripe/portal`). No marketing language — people act on clarity here. |
| 2 | Wait | 2 days |
| 3 | If/Else | Recovered? → Yes: exit. No: continue. |
| 4 | SMS *(consent-gated)* | "Your HomeKey Clean payment didn't go through. Update your card here: {{portal_link}} — your listing stays live in the meantime." |
| 5 | Wait | 3 days |
| 6 | If/Else | Recovered? → Yes: exit. No: continue. |
| 7 | Email | Subject: **Your listing goes offline tomorrow** Body: specific date, what they lose, one CTA. |
| 8 | Wait | 1 day |
| 9 | If/Else | Recovered? → Yes: exit. No: add tag `hkc-listing-suspended` and notify you internally. |

**Don't suspend the listing on the first failure.** Stripe retries declined
subscription invoices over roughly two weeks, and a meaningful share recover on
their own. Let `customer.subscription.updated` move the status to `past_due` and
let this sequence run its course. Suspending immediately loses cleaners who
would have paid.

---

## Build order

1. The sync layer (`ghl-sync.ts`) and the eight tags. Nothing works without it.
2. Workflow 4 — recovers money, smallest surface, easiest to verify.
3. Workflow 1 — you need live cleaners more than anything else right now.
4. Workflow 2 — only once bookings actually exist.
5. Workflow 3 — last, and only after SMS consent is properly captured.

Test each with a contact you control before enabling. GHL fires workflows on
tag add immediately, and there is no undo on a sent message.
