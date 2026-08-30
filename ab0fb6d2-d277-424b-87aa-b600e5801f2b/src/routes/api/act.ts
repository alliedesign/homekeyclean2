import { createFileRoute } from "@tanstack/react-router";

import {
  MIN_HOURS, RATE_MAX_CENTS, RATE_MIN_CENTS, countyForCity, estimate, leadFeeFor, planFor,
} from "@/lib/hkc/domain";
import { cleanerProfile, currentUser, db, ensureSeed, fail, json, uid } from "@/lib/hkc/store.server";

interface ReferralRow {
  id: string; client_id: string; cleaner_id: string; status: string;
  hourly_rate_cents: number; hours: number; estimate_cents: number; lead_fee_cents: number;
}

type Body = Record<string, string | number | boolean | string[] | null | undefined>;

export const Route = createFileRoute("/api/act")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await ensureSeed();
        const user = await currentUser(request);
        if (!user) return fail("Sign in to continue", 401);
        const b = (await request.json().catch(() => null)) as Body | null;
        if (!b) return fail("Could not read that request");
        const action = String(b.action ?? "");

        if (action === "request") {
          if (!b.disclosureAck) return fail("Please confirm you have read how referrals work");
          const cleanerId = String(b.cleanerId ?? "");
          const cleaner = await cleanerProfile(cleanerId);
          if (!cleaner) return fail("That cleaner was not found", 404);
          if (cleaner.status !== "active" || !cleaner.accepting) {
            return fail("That cleaner is not taking new work right now");
          }
          if (cleanerId === user.id) return fail("You cannot refer yourself");
          const hours = Number(b.hours);
          if (!Number.isFinite(hours) || hours < MIN_HOURS) return fail(`Requests start at ${MIN_HOURS} hours`);
          const city = String(b.city ?? "");
          const county = countyForCity(city);
          if (!county) return fail("We only cover Los Angeles and Orange County right now");
          // Street address is deliberately NOT required here. It is collected
          // once the cleaner accepts (action "address" below). City and ZIP are,
          // because coverage and travel radius depend on them.
          if (!/^\d{5}$/.test(String(b.zip ?? ""))) return fail("Enter a 5 digit ZIP code");
          if (!String(b.scheduledAt ?? "")) return fail("Pick a date and time");

          const rate = cleaner.hourly_rate_cents;
          const id = uid("ref");
          await db()
            .prepare(
              `INSERT INTO referrals (id, client_id, cleaner_id, service_type, hourly_rate_cents, hours,
                estimate_cents, lead_fee_cents, address, unit, city, zip, county, bedrooms, bathrooms,
                sqft, scheduled_at, frequency, addons, pets, access_notes, notes, status, disclosure_ack)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'requested',1)`,
            )
            .bind(
              id, user.id, cleanerId, b.serviceType === "commercial" ? "commercial" : "residential",
              rate, hours, estimate(rate, hours), leadFeeFor(cleaner.plan), null,
              (b.unit as string) || null, city, String(b.zip), county,
              b.bedrooms ? Number(b.bedrooms) : null, b.bathrooms ? Number(b.bathrooms) : null,
              b.sqft ? Number(b.sqft) : null, String(b.scheduledAt), String(b.frequency ?? "once"),
              JSON.stringify(Array.isArray(b.addons) ? b.addons : []), (b.pets as string) || null,
              null, (b.notes as string) || null,
            )
            .run();
          return json({ ok: true, referralId: id });
        }

        if (action === "cancel") {
          const row = await db()
            .prepare("SELECT * FROM referrals WHERE id = ? AND client_id = ?")
            .bind(String(b.referralId), user.id)
            .first<ReferralRow>();
          if (!row) return fail("That request was not found", 404);
          if (row.status === "completed") return fail("That job is already finished");
          await db()
            .prepare("UPDATE referrals SET status = 'cancelled' WHERE id = ?")
            .bind(row.id)
            .run();
          return json({ ok: true });
        }

        if (action === "address") {
          const row = await db()
            .prepare("SELECT * FROM referrals WHERE id = ? AND client_id = ?")
            .bind(String(b.referralId), user.id)
            .first<ReferralRow>();
          if (!row) return fail("That request was not found", 404);
          if (row.status !== "accepted") {
            return fail("Add the address once your cleaner has accepted");
          }
          const address = String(b.address ?? "").trim();
          if (!address) return fail("Enter the street address");
          await db()
            .prepare(
              `UPDATE referrals SET address = ?, unit = ?, access_notes = ?,
                address_provided_at = now() WHERE id = ?`,
            )
            .bind(address, (b.unit as string) || null, (b.accessNotes as string) || null, row.id)
            .run();
          return json({ ok: true });
        }

        if (action === "review") {
          const stars = Number(b.stars);
          if (![1, 2, 3, 4, 5].includes(stars)) return fail("Pick a rating from one to five stars");
          const row = await db()
            .prepare("SELECT * FROM referrals WHERE id = ? AND client_id = ?")
            .bind(String(b.referralId), user.id)
            .first<ReferralRow>();
          if (!row) return fail("That request was not found", 404);
          if (row.status !== "completed") return fail("You can rate a clean once it is finished");
          const already = await db()
            .prepare("SELECT id FROM reviews WHERE booking_id = ?")
            .bind(row.id)
            .first<{ id: string }>();
          if (already) return fail("You already rated this clean");
          await db()
            .prepare(
              "INSERT INTO reviews (id, booking_id, cleaner_id, client_id, stars, comment) VALUES (?,?,?,?,?,?)",
            )
            .bind(uid("rev"), row.id, row.cleaner_id, user.id, stars, (b.comment as string) || null)
            .run();
          await db()
            .prepare(
              "UPDATE cleaners SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE user_id = ?",
            )
            .bind(stars, row.cleaner_id)
            .run();
          return json({ ok: true });
        }

        /* ---------------- cleaner side ---------------- */
        const cleaner = await cleanerProfile(user.id);
        if (!cleaner) return fail("This account is not a cleaner account", 403);

        if (action === "accept" || action === "decline" || action === "complete") {
          const row = await db()
            .prepare("SELECT * FROM referrals WHERE id = ? AND cleaner_id = ?")
            .bind(String(b.referralId), user.id)
            .first<ReferralRow>();
          if (!row) return fail("That referral was not found", 404);

          if (action === "accept") {
            if (row.status !== "requested") return fail("That referral is no longer open");
            const fee = leadFeeFor(cleaner.plan);
            await db()
              .prepare(
                "UPDATE referrals SET status = 'accepted', responded_at = now(), lead_fee_cents = ? WHERE id = ?",
              )
              .bind(fee, row.id)
              .run();
            if (fee > 0) {
              await db()
                .prepare("UPDATE cleaners SET fees_owed_cents = fees_owed_cents + ? WHERE user_id = ?")
                .bind(fee, user.id)
                .run();
            }
            return json({ leadFeeCents: fee, ok: true });
          }

          if (action === "decline") {
            if (row.status !== "requested") return fail("That referral is no longer open");
            await db()
              .prepare(
                "UPDATE referrals SET status = 'declined', decline_reason = ?, responded_at = now() WHERE id = ?",
              )
              .bind((b.reason as string) || null, row.id)
              .run();
            return json({ ok: true });
          }

          if (row.status !== "accepted") return fail("Accept the referral before marking it done");
          await db()
            .prepare("UPDATE referrals SET status = 'completed', completed_at = now() WHERE id = ?")
            .bind(row.id)
            .run();
          await db()
            .prepare("UPDATE cleaners SET jobs_completed = jobs_completed + 1 WHERE user_id = ?")
            .bind(user.id)
            .run();
          return json({ ok: true });
        }

        if (action === "profile") {
          const rate = Number(b.hourlyRateCents);
          if (!Number.isFinite(rate) || rate < RATE_MIN_CENTS || rate > RATE_MAX_CENTS) {
            return fail("Set an hourly rate between $25 and $150");
          }
          const ready = Boolean(b.idVerified) && Boolean(b.backgroundCheck) && Boolean(b.businessLicense);
          await db()
            .prepare(
              `UPDATE cleaners SET headline = ?, bio = ?, areas = ?, years_experience = ?,
                specialties = ?, hourly_rate_cents = ?, accepting = ?, id_verified = ?,
                background_check = ?, payment_on_file = ?, status = ? WHERE user_id = ?`,
            )
            .bind(
              String(b.headline ?? ""), String(b.bio ?? ""), String(b.areas ?? ""),
              Number(b.years ?? 0), JSON.stringify(Array.isArray(b.specialties) ? b.specialties : []),
              Math.round(rate), b.accepting ? 1 : 0, b.idVerified ? 1 : 0, b.backgroundCheck ? 1 : 0,
              b.businessLicense ? 1 : 0, ready ? "active" : "pending", user.id,
            )
            .run();
          return json({ ok: true, status: ready ? "active" : "pending" });
        }

        if (action === "plan") {
          const plan = planFor(String(b.planId ?? "listed"));
          await db()
            .prepare("UPDATE cleaners SET plan = ? WHERE user_id = ?")
            .bind(plan.id, user.id)
            .run();
          return json({ ok: true, plan: plan.id });
        }

        return fail("Unknown action");
      },
    },
  },
});
