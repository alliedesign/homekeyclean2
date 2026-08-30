# HomeKey Clean — programmatic SEO page set

96 pages, ~50,000 words, built from your live coverage data.

| type | count | what it targets |
|---|---|---|
| Service | 8 | "deep cleaning", "move out cleaning", "office cleaning"… |
| City | 44 | "house cleaners in Santa Monica" |
| City × service | 36 | "move out cleaning Fullerton" — only combinations that are real searches |
| Guide | 8 | "how much does house cleaning cost", "move out checklist" |

## Read this before you publish

**Every `{{TOKEN}}` is a live data binding, not text.** Resolve them server-side at
render. They are deliberately not hardcoded, because your cleaners set their own
rates and those change.

| token | resolve to |
|---|---|
| `{{CLEANER_CARDS}}` | the directory card list, filtered by the page's `filter` block in `manifest.json` |
| `{{CLEANER_COUNT}}` | `count(*)` of active, accepting cleaners matching that filter |
| `{{RATE_LOW}}` / `{{RATE_HIGH}}` | `min`/`max` of `hourly_rate_cents / 100` across that filter |

**The empty-state rule matters right now.** Your directory currently has zero
active cleaners. When `{{CLEANER_COUNT}}` is 0, suppress any sentence containing a
rate binding and render the join CTA instead. A page reading "cleaners from $0"
is worse than no page. Every page here was written so it still reads correctly
with an empty directory — don't break that by rendering raw zeroes.

## Filters

`manifest.json` gives each page a `filter` block that maps directly onto your schema:

```sql
-- city page: filter.zips
select * from cleaners c join users u on u.id = c.user_id
 where c.status = 'active' and c.accepting = 1 and c.base_zip = any($1);

-- city x service: filter.zips + filter.specialty
select * from cleaners c join users u on u.id = c.user_id
 where c.status = 'active' and c.accepting = 1
   and c.base_zip = any($1)
   and c.specialties::jsonb ? $2;
```

`radius_miles` and the `service_zips` lat/lon are the better filter once you have
volume — match cleaners whose radius reaches the page's ZIPs rather than those
based in them. Start with `base_zip`; it's simpler and correct enough at low volume.

## Accuracy

Every ZIP on every page was validated against `service_zips` before generation —
205 ZIPs across 44 cities, zero misses. If you change coverage, regenerate rather
than editing pages by hand, or the two will drift.

No page states a price. No page invents a statistic, a testimonial, or a review
count. The only numbers are ZIP codes and time ranges, and the time ranges are
framed as estimates to discuss, not quotes.

## Duplicate-content check

Measured by 5-gram Jaccard overlap, which is roughly how duplicate detection works:

- No page pair exceeds 70% overlap (the rough threshold where Google starts
  treating pages as duplicates)
- Guides: 0% mean overlap — fully hand-written
- Service pages: 34% mean
- City pages: 49% mean, worst pair 56%
- City × service: 26% mean, worst pair 55%
- Median page is 30% wholly unique content; the weakest is 16%

City pages share the most, which is inherent — they answer the same question in
different places. What keeps them defensible is that each carries a hand-written
local paragraph, its real ZIP list, real neighbourhoods and real adjacent cities.

**This is why I pushed back on the full matrix.** 390 ZIPs × 8 specialties is
3,120 pages that could not carry that, and thin templated pages at that scale get
a site classified as doorway pages — which harms the pages you already rank for.
96 pages that each say something true is the version that works.

## Suggested rollout

1. Ship the 8 service pages and 8 guides first. They're the strongest and
   entirely independent of directory volume.
2. Ship city pages for the 10 cities where you actually have cleaners. A city
   page with an empty directory converts nobody and earns no links.
3. Hold the city × service pages until those cities have 3+ cleaners each.
4. Submit `sitemap.xml` after step 1, not before. Replace the domain placeholder.

Publishing all 96 the day the directory is empty is the one way to make this set
work against you.

## Files

- `pages/*.md` — YAML frontmatter (title, description, h1, canonical, JSON-LD
  schema, internal links, filter) plus markdown body
- `manifest.json` — every page's slug, metadata, filter and priority
- `sitemap.xml` — replace `REPLACE-WITH-YOUR-DOMAIN`
