import { createFileRoute } from "@tanstack/react-router";
import postgres from "postgres";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const raw = process.env.DATABASE_URL ?? "";
        const out: Record<string, unknown> = { hasVar: raw.length > 0, length: raw.length };

        if (raw) {
          out.looksLikeUrl = /^postgres(ql)?:\/\//.test(raw);
          out.stillHasPlaceholder = /YOUR-PASSWORD|\[|\]/.test(raw);
          const m = /^postgres(?:ql)?:\/\/([^:]+):([^@]*)@([^:/]+):(\d+)\/(.+)$/.exec(raw);
          if (m) {
            out.user = m[1];
            out.passwordLength = m[2].length;
            out.host = m[3];
            out.port = m[4];
            out.database = m[5];
          } else {
            out.parsed = false;
          }

          try {
            const sql = postgres(raw, {
              connect_timeout: 10, idle_timeout: 5, max: 1, prepare: false, ssl: "require",
            });
            const rows = await sql`select count(*)::int as cleaners from cleaners`;
            out.connected = true;
            out.result = rows[0];
            await sql.end();
          } catch (e) {
            out.connected = false;
            out.error = e instanceof Error ? e.message : String(e);
            out.code = (e as { code?: string }).code ?? null;
          }
        }

        return new Response(JSON.stringify(out, null, 2), {
          headers: { "content-type": "application/json" },
          status: 200,
        });
      },
    },
  },
});
