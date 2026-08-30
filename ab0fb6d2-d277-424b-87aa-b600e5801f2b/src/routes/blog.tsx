import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { SiteFooter, SiteNav } from "@/components/hkc/chrome";
import { EmptyState } from "@/components/hkc/ui";
import { listPosts, type BlogCard } from "@/lib/hkc/blog.server";

/* Runs on the server during SSR, so crawlers get the real list rather than an
   empty shell. A client-fetched blog is invisible to search, which would
   defeat the point of putting it on this domain in the first place. */
const loadIndex = createServerFn({ method: "GET" }).handler(async () => {
  const posts = await listPosts("", 24);
  return { posts };
});

export const Route = createFileRoute("/blog")({
  component: BlogIndex,
  loader: async () => loadIndex(),
  head: () => ({
    meta: [
      { title: "Cleaning guides and advice | HomeKey Clean" },
      { content: "Practical guides on hiring cleaners, deep cleans, move-out cleaning and costs across Los Angeles and Orange County.", name: "description" },
    ],
    links: [{ href: "/blog", rel: "canonical" }],
  }),
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function PostCard({ post }: { post: BlogCard }) {
  return (
    <article className="hk-card flex flex-col overflow-hidden rounded-hk-lg border border-hk-line bg-hk-paper">
      {post.hero_image ? (
        <div className="hk-card-media">
          <img alt="" aria-hidden="true" className="h-auto w-full object-cover" height={520}
            loading="lazy" src={post.hero_image} width={720}
            onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback !== "1") { t.dataset.fallback = "1"; t.src = "/assets/brand/pattern.png"; } }} />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <span className="font-hk-mono text-xs uppercase tracking-[0.16em] text-hk-accent">
          {post.category}
        </span>
        <h2 className="mt-3 font-hk-display text-xl font-medium leading-tight tracking-tight text-hk-ink">
          <a className="transition-colors hover:text-hk-accent" href={`/blog/${post.slug}`}>{post.title}</a>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 flex-1 text-sm leading-relaxed text-hk-muted">{post.excerpt}</p>
        ) : null}
        <p className="mt-5 font-hk-mono text-xs text-hk-muted">
          {formatDate(post.published_at)} · {post.reading_minutes} min read
        </p>
      </div>
    </article>
  );
}

function BlogIndex() {
  const { posts } = Route.useLoaderData();

  return (
    <>
      <SiteNav />
      <main className="mx-auto min-h-[70dvh] max-w-[1180px] px-5 py-16">
        <h1 className="max-w-[16ch] font-hk-display text-4xl font-semibold leading-none tracking-tighter text-hk-ink md:text-6xl">
          Guides worth reading before you book
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-hk-muted">
          What cleaning actually costs, what a deep clean includes, and how to get your deposit
          back. Written for people hiring an independent cleaner, not for search engines.
        </p>

        {posts.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              body="The first guides are being written. Check back shortly, or browse the directory in the meantime."
              icon="sparkle" title="Nothing published yet" />
          </div>
        ) : (
          <div className="hk-stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => <PostCard key={post.slug} post={post} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
