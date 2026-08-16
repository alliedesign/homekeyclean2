import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

const TITLE = "HomeKey Clean";
const DESCRIPTION =
  "Background checked house and commercial cleaners across Los Angeles and Orange County. Priced by star rating, booked and paid in one pass.";
const OG_IMAGE = "/assets/brand/og-card.jpg";
const THEME_COLOR = "#f6f8f5";
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  head: () => ({
    links: [
      { href: appCss, rel: "stylesheet" },
      { href: "https://fonts.googleapis.com", rel: "preconnect" },
      { crossOrigin: "anonymous" as const, href: "https://fonts.gstatic.com", rel: "preconnect" },
      { href: FONT_HREF, rel: "stylesheet" },
      { href: "/assets/brand/favicon.ico", rel: "icon", sizes: "any" },
      { href: "/assets/brand/favicon-32.png", rel: "icon", sizes: "32x32", type: "image/png" },
      { href: "/assets/brand/favicon-16.png", rel: "icon", sizes: "16x16", type: "image/png" },
      { href: "/assets/brand/apple-touch-icon.png", rel: "apple-touch-icon", sizes: "180x180" },
      { href: "/site.webmanifest", rel: "manifest" },
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { title: TITLE },
      { content: DESCRIPTION, name: "description" },
      { content: THEME_COLOR, name: "theme-color" },
      { content: TITLE, property: "og:title" },
      { content: DESCRIPTION, property: "og:description" },
      { content: "website", property: "og:type" },
      { content: TITLE, property: "og:site_name" },
      { content: OG_IMAGE, property: "og:image" },
      { content: "A brass key resting on folded towels in a sunlit kitchen", property: "og:image:alt" },
      { content: "summary_large_image", name: "twitter:card" },
      { content: OG_IMAGE, name: "twitter:image" },
    ],
  }),
  notFoundComponent: NotFoundComponent,
  shellComponent: RootShell,
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-hk-ground px-6 text-center">
      <img alt="" aria-hidden="true" height={56} src="/assets/brand/mark.png" width={56} />
      <h1 className="font-hk-display text-3xl font-semibold tracking-tight text-hk-ink">
        Nothing behind this door
      </h1>
      <p className="max-w-[44ch] text-base leading-relaxed text-hk-muted">
        The page you asked for does not exist. The front door is still open.
      </p>
      <a className="rounded-full bg-hk-accent px-6 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep" href="/">
        Back home
      </a>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-hk-ground px-6 text-center">
      <h1 className="font-hk-display text-3xl font-semibold tracking-tight text-hk-ink">
        This page did not load
      </h1>
      <p className="max-w-[44ch] text-base leading-relaxed text-hk-muted">
        Something went wrong on our side. Try again, or head back to the front page.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="rounded-full bg-hk-accent px-6 py-3 font-hk-display text-base font-medium text-hk-ground transition-colors hover:bg-hk-accent-deep"
          onClick={() => { router.invalidate(); reset(); }} type="button">
          Try again
        </button>
        <a className="rounded-full border border-hk-ink/25 px-6 py-3 font-hk-display text-base font-medium text-hk-ink transition-colors hover:bg-hk-ink hover:text-hk-ground" href="/">
          Back home
        </a>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-hk-ground text-hk-ink antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
