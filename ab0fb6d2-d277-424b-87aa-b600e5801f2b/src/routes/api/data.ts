import { createFileRoute } from "@tanstack/react-router";

import { cleanerProfile, currentUser, db, ensureSeed, fail, json } from "@/lib/hkc/store.server";

export const Route = createFileRoute("/api/data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureSeed();
        const params = new URL(request.url).searchParams;
        const scope = params.get("scope") ?? "directory";

        // The directory is public on purpose. Browsing cleaners is the product.
        if (scope === "directory") {
          const city = params.get("city") ?? "";
          const specialty = params.get("specialty") ?? "";
          const limit = Math.min(60, Math.max(1, Number(params.get("limit") ?? 6)));
          const rows = await db()
            .prepare(
              `SELECT c.user_id, c.headline, c.bio, c.areas, c.years_experience, c.rating_sum,
                      c.rating_count, c.jobs_completed, c.avatar, c.hourly_rate_cents, c.plan,
                      c.specialties, c.accepting, c.id_verified, c.background_check, u.name
               FROM cleaners c JOIN users u ON u.id = c.user_id
               WHERE c.status = 'active' AND c.accepting = 1
                 AND (? = '' OR c.areas LIKE ?)
                 AND (? = '' OR c.specialties LIKE ?)
               ORDER BY CASE c.plan WHEN 'pro' THEN 0 ELSE 1 END,
                        CASE WHEN c.rating_count = 0 THEN 0 ELSE (c.rating_sum * 1.0 / c.rating_count) END DESC,
                        c.jobs_completed DESC
               LIMIT ?`,
            )
            .bind(city, `%${city}%`, specialty, `%"${specialty}"%`, limit)
            .all();
          return json({ cleaners: rows.results ?? [] });
        }

        // "Match me" — for people who do not want to compare forty profiles.
        // Also public: the whole point is answering before anyone signs up.
        if (scope === "match") {
          const zip = params.get("zip") ?? "";
          if (!/^\d{5}$/.test(zip)) return fail("Enter a 5 digit ZIP code");
          const specialty = params.get("specialty") ?? "";
          const rows = await db()
            .prepare(
              `WITH origin AS (SELECT lat, lon FROM service_zips WHERE zip = ?)
               SELECT c.user_id, c.headline, c.areas, c.years_experience, c.rating_sum,
                      c.rating_count, c.jobs_completed, c.avatar, c.hourly_rate_cents,
                      c.plan, c.specialties, c.id_verified, c.background_check, u.name,
                      ROUND(3959 * ACOS(LEAST(1, GREATEST(-1,
                        SIN(RADIANS(o.lat)) * SIN(RADIANS(z.lat)) +
                        COS(RADIANS(o.lat)) * COS(RADIANS(z.lat)) *
                        COS(RADIANS(z.lon) - RADIANS(o.lon))
                      )))::numeric, 1) AS miles
                 FROM cleaners c
                 JOIN users u ON u.id = c.user_id
                 JOIN service_zips z ON z.zip = c.base_zip
                 CROSS JOIN origin o
                WHERE c.status = 'active' AND c.accepting = 1
                  AND (? = '' OR c.specialties LIKE ?)
                ORDER BY
                  CASE WHEN ? = '' THEN 1 WHEN c.specialties LIKE ? THEN 0 ELSE 1 END,
                  (3959 * ACOS(LEAST(1, GREATEST(-1,
                    SIN(RADIANS(o.lat)) * SIN(RADIANS(z.lat)) +
                    COS(RADIANS(o.lat)) * COS(RADIANS(z.lat)) *
                    COS(RADIANS(z.lon) - RADIANS(o.lon))
                  )))) <= c.radius_miles DESC,
                  CASE WHEN c.rating_count = 0 THEN 0
                       ELSE (c.rating_sum * 1.0 / c.rating_count) END DESC,
                  c.jobs_completed DESC
                LIMIT 3`,
            )
            .bind(zip, specialty, `%"${specialty}"%`, specialty, `%"${specialty}"%`)
            .all();
          return json({ matches: rows.results ?? [] });
        }

        // Live rate range for a ZIP, so the price question can be answered
        // before anyone is asked to choose a person or hand over an address.
        if (scope === "rates") {
          const zip = params.get("zip") ?? "";
          const row = await db()
            .prepare(
              `SELECT COUNT(*)::int AS n,
                      MIN(c.hourly_rate_cents)::int AS low,
                      MAX(c.hourly_rate_cents)::int AS high
                 FROM cleaners c
                 LEFT JOIN service_zips z ON z.zip = c.base_zip
                WHERE c.status = 'active' AND c.accepting = 1
                  AND (? = '' OR z.zip IS NOT NULL)`,
            )
            .bind(zip)
            .first<{ n: number; low: number | null; high: number | null }>();
          return json({ rates: row ?? { n: 0, low: null, high: null } });
        }

        const user = await currentUser(request);
        if (!user) return fail("Sign in to continue", 401);

        if (scope === "client") {
          const rows = await db()
            .prepare(
              `SELECT r.*, u.name AS cleaner_name, u.email AS cleaner_email, u.phone AS cleaner_phone, c.avatar AS cleaner_avatar,
                      c.rating_sum AS cleaner_rating_sum, c.rating_count AS cleaner_rating_count,
                      v.stars AS review_stars
               FROM referrals r
               JOIN users u ON u.id = r.cleaner_id
               LEFT JOIN cleaners c ON c.user_id = r.cleaner_id
               LEFT JOIN reviews v ON v.booking_id = r.id
               WHERE r.client_id = ? ORDER BY r.scheduled_at DESC`,
            )
            .bind(user.id)
            .all();
          return json({ referrals: rows.results ?? [], user });
        }

        if (scope === "work") {
          const cleaner = await cleanerProfile(user.id);
          if (!cleaner) return fail("This account is not a cleaner account", 403);
          const rows = await db()
            .prepare(
              `SELECT r.*, u.name AS client_name, u.phone AS client_phone, u.email AS client_email,
                      v.stars AS review_stars, v.comment AS review_comment
               FROM referrals r
               JOIN users u ON u.id = r.client_id
               LEFT JOIN reviews v ON v.booking_id = r.id
               WHERE r.cleaner_id = ? ORDER BY r.scheduled_at DESC`,
            )
            .bind(user.id)
            .all();
          type Row = { status: string; estimate_cents: number; lead_fee_cents: number };
          const list = (rows.results ?? []) as unknown as Row[];
          const earned = list
            .filter((r) => r.status === "completed")
            .reduce((n, r) => n + r.estimate_cents, 0);
          const upcoming = list
            .filter((r) => r.status === "accepted")
            .reduce((n, r) => n + r.estimate_cents, 0);
          const fees = list.reduce((n, r) => n + (r.lead_fee_cents ?? 0), 0);
          return json({
            cleaner,
            referrals: rows.results ?? [],
            stats: { bookedCents: upcoming, earnedCents: earned, feesCents: fees },
            user,
          });
        }

        return fail("Unknown scope");
      },
    },
  },
});
