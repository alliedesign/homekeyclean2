import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { SiteFooter, SiteNav } from "@/components/hkc/chrome";
import { Markdown, stripMarkdown } from "@/components/hkc/markdown";
import { getPost, relatedPosts } from "@/lib/hkc/blog.server";

const loadPost = createServerFn({ method: "GET" })
  .inputValidator((slug: unknown) => String(slug ?? ""))
  .handler(async ({ data: slug }) => {
    const post = await getPost(slug);
    if (!post) return { post: null, related: [] };
    return { post, related: await relatedPosts(post.slug, post.category) };
  });

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  loader: async ({ params }) => {
    const result = await loadPost({ data: params.slug });
    if (!result.post) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Guide not found | HomeKey Clean" }] };
    const description = post.seo_description ?? post.excerpt ?? stripMarkdown(post.body_md);
    const url = `/blog/${post.slug}`;
    return {
      meta: [
        { title: `${post.seo_title ?? post.title} | HomeKey Clean` },
        { content: description, name: "description" },
        { content: post.seo_title ?? post.title, property: "og:title" },
        { content: description, property: "og:description" },
        { content: "article", property: "og:type" },
        ...(post.hero_image ? [{ content: post.hero_image, property: "og:image" }] : []),
      ],
      links: [{ href: url, rel: "canonical" }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description,
          datePublished: post.published_at,
          author: { "@type": "Organization", name: post.author_name },
          publisher: { "@type": "Organization", name: "HomeKey Clean" },
          mainEntityOfPage: url,
          ...(post.hero_image ? { image: post.hero_image } : {}),
        }),
      }],
    };
  },
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function BlogPostPage() {
  const { post, related } = Route.useLoaderData();
  if (!post) return null;

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <nav aria-label="Breadcrumb" className="font-hk-mono text-xs text-hk-muted">
          <a className="transition-colors hover:text-hk-ink" href="/">Home</a>
          <span aria-hidden="true"> / </span>
          <a className="transition-colors hover:text-hk-ink" href="/blog">Guides</a>
        </nav>

        <article className="mt-8 max-w-[72ch]">
          <span className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-accent">
            {post.category}
          </span>
          <h1 className="mt-4 font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 font-hk-mono text-xs text-hk-muted">
            {formatDate(post.published_at)} · {post.reading_minutes} min read · {post.author_name}
          </p>

          {post.hero_image ? (
            <img alt="" aria-hidden="true" className="mt-9 w-full rounded-hk-lg" height={720}
              src={post.hero_image} width={1180}
              onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback !== "1") { t.dataset.fallback = "1"; t.src = "/assets/brand/pattern.png"; } }} />
          ) : null}

          <div className="mt-10">
            <Markdown source={post.body_md} />
          </div>

          <div className="mt-14 rounded-hk-lg border border-hk-line bg-hk-accent-wash p-8">
            <h2 className="font-hk-display text-xl font-medium tracking-tight text-hk-ink">
              Ready to find someone?
            </h2>
            <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-hk-muted">
              Every cleaner in the directory is independent and sets their own rate. We take no
              commission — your cleaner keeps their full rate.
            </p>
            <a className="mt-6 inline-flex rounded-full bg-hk-accent px-7 py-3.5 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep"
              href="/find">
              Browse cleaners
            </a>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-16 border-t border-hk-line pt-12">
            <h2 className="font-hk-display text-2xl font-medium tracking-tight text-hk-ink">
              More on {post.category}
            </h2>
            <div className="hk-stagger mt-8 grid gap-5 sm:grid-cols-3">
              {related.map((r) => (
                <a className="hk-card rounded-hk-lg border border-hk-line bg-hk-paper p-6" href={`/blog/${r.slug}`} key={r.slug}>
                  <h3 className="font-hk-display text-lg font-medium leading-tight tracking-tight text-hk-ink">
                    {r.title}
                  </h3>
                  <p className="mt-3 font-hk-mono text-xs text-hk-muted">{r.reading_minutes} min read</p>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
