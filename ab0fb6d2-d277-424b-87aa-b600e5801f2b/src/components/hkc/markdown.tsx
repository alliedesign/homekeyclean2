/**
 * Minimal markdown renderer that returns React elements.
 *
 * Deliberately NOT dangerouslySetInnerHTML and deliberately not a dependency:
 * post bodies are stored in the database, and anything that renders raw HTML
 * from a database column is one compromised row away from stored XSS. React
 * escapes every text node here, so a post body cannot inject markup.
 *
 * Supports: # h1-h4, paragraphs, - and 1. lists, > blockquote, --- rule,
 * `code`, **bold**, *italic*, [links](url), and ![images](url).
 */
import type { ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|!?\[[^\]]*\]\([^)]+\))/g;

function safeHref(url: string): string | null {
  const u = url.trim();
  // Block javascript:, data:, vbscript: and anything else exotic.
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u)) return u;
  return null;
}

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  let i = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const tok = match[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) {
      out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code className="rounded bg-hk-accent-wash px-1.5 py-0.5 font-hk-mono text-[0.9em] text-hk-ink" key={key}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("![")) {
      const alt = tok.slice(2, tok.indexOf("]"));
      const src = safeHref(tok.slice(tok.indexOf("](") + 2, -1));
      out.push(src
        ? <img alt={alt} className="my-6 w-full rounded-hk-lg" key={key} loading="lazy" src={src} />
        : <span key={key}>{alt}</span>);
    } else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      const href = safeHref(tok.slice(tok.indexOf("](") + 2, -1));
      out.push(href
        ? <a className="text-hk-accent underline underline-offset-4" href={href} key={key}>{label}</a>
        : <span key={key}>{label}</span>);
    } else {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = match.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const H = ["", "text-3xl md:text-4xl", "text-2xl md:text-3xl", "text-xl md:text-2xl", "text-lg"];

export function Markdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (/^---+\s*$/.test(line)) {
      blocks.push(<hr className="my-10 border-hk-line" key={`hr-${k++}`} />);
      i++; continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const Tag = (["h1", "h2", "h3", "h4"] as const)[level - 1];
      blocks.push(
        <Tag className={`mt-12 font-hk-display font-semibold tracking-tighter text-hk-ink ${H[level]}`}
          key={`h-${k++}`}>
          {inline(heading[2], `h${k}`)}
        </Tag>,
      );
      i++; continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, "")); i++; }
      blocks.push(
        <blockquote className="my-8 border-l-2 border-hk-accent pl-6 text-lg italic leading-relaxed text-hk-ink-soft"
          key={`q-${k++}`}>
          {inline(quote.join(" "), `q${k}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++;
      }
      blocks.push(
        <ul className="my-6 space-y-2.5 pl-1" key={`ul-${k++}`}>
          {items.map((it, n) => (
            <li className="flex gap-3 text-base leading-relaxed text-hk-ink-soft" key={n}>
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hk-accent" />
              <span>{inline(it, `li${k}-${n}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++;
      }
      blocks.push(
        <ol className="my-6 list-decimal space-y-2.5 pl-6" key={`ol-${k++}`}>
          {items.map((it, n) => (
            <li className="text-base leading-relaxed text-hk-ink-soft" key={n}>{inline(it, `oli${k}-${n}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim()
      && !/^(#{1,4}\s|>|---+\s*$|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push(
      <p className="mt-5 text-base leading-relaxed text-hk-ink-soft md:text-lg" key={`p-${k++}`}>
        {inline(para.join(" "), `p${k}`)}
      </p>,
    );
  }

  return <div className="hk-prose">{blocks}</div>;
}

/** Plain-text preview, for meta descriptions when no excerpt is set. */
export function stripMarkdown(source: string, max = 155): string {
  const flat = source
    .replace(/^#{1,4}\s+/gm, "").replace(/[*`>]/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}
