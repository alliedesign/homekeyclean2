/** Server-only blog queries. Imported by server functions, never by components. */
import { db } from "./store.server";

export interface BlogCard {
  slug: string;
  title: string;
  excerpt: string | null;
  hero_image: string | null;
  author_name: string;
  category: string;
  tags: string;
  reading_minutes: number;
  published_at: string;
}

export interface BlogPost extends BlogCard {
  id: string;
  body_md: string;
  seo_title: string | null;
  seo_description: string | null;
}

const CARD_COLUMNS = `slug, title, excerpt, hero_image, author_name, category, tags,
  reading_minutes, published_at`;

export async function listPosts(category = "", limit = 24): Promise<BlogCard[]> {
  const rows = await db()
    .prepare(
      `SELECT ${CARD_COLUMNS} FROM blog_posts
        WHERE status = 'published' AND published_at <= now()
          AND (? = '' OR category = ?)
        ORDER BY published_at DESC
        LIMIT ?`,
    )
    .bind(category, category, Math.min(60, Math.max(1, limit)))
    .all<BlogCard>();
  return rows.results ?? [];
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  return db()
    .prepare(
      `SELECT id, ${CARD_COLUMNS}, body_md, seo_title, seo_description
         FROM blog_posts
        WHERE slug = ? AND status = 'published' AND published_at <= now()`,
    )
    .bind(slug)
    .first<BlogPost>();
}

/** Related posts by category, excluding the current one. */
export async function relatedPosts(slug: string, category: string): Promise<BlogCard[]> {
  const rows = await db()
    .prepare(
      `SELECT ${CARD_COLUMNS} FROM blog_posts
        WHERE status = 'published' AND published_at <= now()
          AND slug <> ? AND category = ?
        ORDER BY published_at DESC LIMIT 3`,
    )
    .bind(slug, category)
    .all<BlogCard>();
  return rows.results ?? [];
}

export async function allPublishedSlugs(): Promise<{ slug: string; published_at: string }[]> {
  const rows = await db()
    .prepare(
      `SELECT slug, published_at FROM blog_posts
        WHERE status = 'published' AND published_at <= now()
        ORDER BY published_at DESC`,
    )
    .all<{ slug: string; published_at: string }>();
  return rows.results ?? [];
}
