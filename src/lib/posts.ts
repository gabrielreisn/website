import { extractPlainText, type PortableTextBlock } from "emdash";
import type { Post } from "../../emdash-env";

/** Plain, serializable shape handed to the React components. */
export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  date: string | null;
  isoDate: string | null;
  readingTime: number;
  tags: Tag[];
};

export type Tag = { slug: string; label: string };

/** Shape of an entry returned by getEmDashCollection("posts") / getEmDashEntry("posts"). */
type PostEntry = { id: string; data: Post };

const WORDS_PER_MINUTE = 200;

export function readingTime(content: PortableTextBlock[] | undefined): number {
  const words = extractPlainText(content).match(/\w+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function excerpt(text: string, max = 200): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return `${text.slice(0, cut > 0 ? cut : max)}...`;
}

export function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function tagsOf(post: PostEntry): Tag[] {
  return (post.data.terms?.tag ?? []).map((t) => ({ slug: t.slug, label: t.label }));
}

export function toSummary(post: PostEntry): PostSummary {
  const text = extractPlainText(post.data.content);
  return {
    // entry.id is the URL slug; entry.data.id is the database ULID.
    slug: post.id,
    title: post.data.title,
    excerpt: post.data.description || excerpt(text),
    date: formatDate(post.data.publishedAt),
    isoDate: post.data.publishedAt?.toISOString() ?? null,
    readingTime: readingTime(post.data.content),
    tags: tagsOf(post),
  };
}

/** Turns heading text into a URL fragment, e.g. "Hello World!" -> "hello-world". */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}
