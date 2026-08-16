import { createFileRoute } from "@tanstack/react-router";

import {
  cleanerProfile,
  createSession,
  currentUser,
  db,
  ensureSeed,
  fail,
  hashPassword,
  json,
  newSalt,
  readCookie,
  SESSION_COOKIE,
  sessionCookie,
  uid,
} from "@/lib/hkc/store.server";

export const Route = createFileRoute("/api/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await ensureSeed();
        const user = await currentUser(request);
        if (!user) return json({ cleaner: null, user: null });
        const cleaner = user.role === "cleaner" ? await cleanerProfile(user.id) : null;
        return json({ cleaner, user });
      },
      POST: async ({ request }) => {
        await ensureSeed();
        const body = (await request.json().catch(() => null)) as Record<string, string> | null;
        if (!body) return fail("Could not read that request");
        const action = body.action;

        if (action === "signout") {
          const sid = readCookie(request, SESSION_COOKIE);
          if (sid) await db().prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
          return json({ ok: true }, { headers: { "set-cookie": sessionCookie("", 0) } });
        }

        const email = (body.email ?? "").trim().toLowerCase();
        const password = body.password ?? "";
        if (!email.includes("@")) return fail("Enter a valid email address");
        if (password.length < 8) return fail("Password needs at least 8 characters");

        if (action === "signup") {
          const name = (body.name ?? "").trim();
          const role = body.role === "cleaner" ? "cleaner" : "client";
          if (name.length < 2) return fail("Enter your name");
          const taken = await db()
            .prepare("SELECT id FROM users WHERE email = ?")
            .bind(email)
            .first<{ id: string }>();
          if (taken) return fail("That email already has an account. Sign in instead.");
          const salt = newSalt();
          const hash = await hashPassword(password, salt);
          const id = uid("usr");
          await db()
            .prepare(
              "INSERT INTO users (id, email, name, phone, role, password_hash, password_salt) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(id, email, name, body.phone ?? null, role, hash, salt)
            .run();
          if (role === "cleaner") {
            await db()
              .prepare("INSERT INTO cleaners (user_id, status) VALUES (?, 'pending')")
              .bind(id)
              .run();
          }
          const sid = await createSession(id);
          return json(
            { ok: true, role },
            { headers: { "set-cookie": sessionCookie(sid, 60 * 60 * 24 * 30) } },
          );
        }

        if (action === "signin") {
          const row = await db()
            .prepare("SELECT id, role, password_hash, password_salt FROM users WHERE email = ?")
            .bind(email)
            .first<{ id: string; role: string; password_hash: string; password_salt: string }>();
          if (!row) return fail("No account found for that email", 401);
          const hash = await hashPassword(password, row.password_salt);
          if (hash !== row.password_hash) return fail("That password does not match", 401);
          const sid = await createSession(row.id);
          return json(
            { ok: true, role: row.role },
            { headers: { "set-cookie": sessionCookie(sid, 60 * 60 * 24 * 30) } },
          );
        }

        return fail("Unknown action");
      },
    },
  },
});
