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
          const limit = Math.min(60, Math.max(1, Number(params.get("limit") ?? 40)));
          const rows = await db()
            .prepare(
              `SELECT c.user_id, c.headline, c.bio, c.areas, c.years_experience, c.rating_sum,
                      c.rating_count, c.jobs_completed, c.avatar, c.hourly_rate_cents, c.plan,
                      c.specialties, c.accepting, u.name
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
