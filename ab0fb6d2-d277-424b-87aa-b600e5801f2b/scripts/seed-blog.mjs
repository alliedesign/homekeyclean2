/**
 * Import the generated guide pages into blog_posts.
 *
 * Reads the markdown produced for the SEO set and publishes each guide as a
 * blog post on this domain. Idempotent: re-running updates existing rows by
 * slug rather than duplicating them.
 *
 *   DATABASE_URL=... node scripts/seed-blog.mjs ~/Downloads/seo/pages
 *
 * The guides are published HERE and should NOT also ship as static pages --
 * the same text on two URLs is self-competing duplicate content.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const dir = process.argv[2] ?? join(process.env.HOME ?? "", "Downloads/seo/pages");
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(1); }

const sql = postgres(url, { prepare: false, ssl: "require", max: 1 });

/** Frontmatter is simple YAML here: `key: "json string"` plus list blocks. */
function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-z0-9_]+):\s*(.+)$/.exec(line); // h1 contains a digit
    if (!kv) continue;
    try { meta[kv[1]] = JSON.parse(kv[2]); } catch { meta[kv[1]] = kv[2]; }
  }
  return { meta, body: m[2] };
}

function readingMinutes(body) {
  return Math.max(1, Math.round(body.split(/\s+/).length / 200));
}

/** Strip the leading H1 -- the page template renders the title itself. */
function stripLeadingH1(body) {
  return body.replace(/^\s*#\s+.*\n+/, "");
}

const files = (await readdir(dir)).filter((f) => f.startsWith("guides_") && f.endsWith(".md"));
if (files.length === 0) {
  console.error(`No guides_*.md found in ${dir}`);
  process.exit(1);
}

let published = 0;
for (const file of files) {
  const raw = await readFile(join(dir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const slug = String(meta.slug ?? "").replace(/^\/guides\//, "").replace(/^\//, "");
  if (!slug) { console.warn(`skip ${file}: no slug`); continue; }

  const md = stripLeadingH1(body).trim();
  const category = meta.audience === "cleaners" ? "for-cleaners" : "guides";

  await sql`
    insert into blog_posts
      (id, slug, title, excerpt, body_md, author_name, category, tags, status,
       seo_title, seo_description, reading_minutes, published_at)
    values (
      ${"post_" + slug.slice(0, 40)}, ${slug}, ${meta.h1 ?? meta.title},
      ${meta.description ?? null}, ${md}, 'HomeKey Clean', ${category}, '[]',
      'published', ${meta.title ?? null}, ${meta.description ?? null},
      ${readingMinutes(md)}, now()
    )
    on conflict (slug) do update set
      title = excluded.title, excerpt = excluded.excerpt, body_md = excluded.body_md,
      category = excluded.category, seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      reading_minutes = excluded.reading_minutes, status = 'published'
  `;
  published += 1;
  console.log(`published /blog/${slug}`);
}

console.log(`\n${published} guide(s) live.`);
await sql.end();
