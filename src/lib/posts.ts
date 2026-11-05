import { extractPlainText, type PortableTextBlock } from "emdash";
import type { Post, Project } from "../../emdash-env";

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

// ── Portfolio ──────────────────────────────────────────────────────────────

export type ProjectSummary = {
  slug: string;
  title: string;
  summary: string;
  role: string | null;
  period: string | null;
  url: string | null;
  repository: string | null;
  featured: boolean;
  stack: Tag[];
  kind: string | null;
  cover: Cover | null;
};

export type Cover = { src: string; alt: string; width?: number; height?: number; color?: string };

type ImageValue = {
  id?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  dominantColor?: string;
  meta?: Record<string, unknown>;
};

/** Public URL for an EmDash image field value (local media is served from its storage key). */
export function imageUrl(image: ImageValue | null | undefined): string | null {
  if (!image) return null;
  if (image.src) return image.src;
  const key = typeof image.meta?.storageKey === "string" ? image.meta.storageKey : null;
  return key ? `/_emdash/api/media/file/${key}` : null;
}

function toCover(image: ImageValue | null | undefined): Cover | null {
  const src = imageUrl(image);
  if (!image || !src) return null;
  return { src, alt: image.alt ?? "", width: image.width, height: image.height, color: image.dominantColor };
}

type ProjectEntry = { id: string; data: Project };

export function toProjectSummary(project: ProjectEntry): ProjectSummary {
  return {
    slug: project.id,
    title: project.data.title,
    summary: project.data.summary || excerpt(extractPlainText(project.data.content)),
    role: project.data.role || null,
    period: project.data.period || null,
    url: project.data.url || null,
    repository: project.data.repository || null,
    featured: project.data.featured ?? false,
    stack: (project.data.terms?.stack ?? []).map((t) => ({ slug: t.slug, label: t.label })),
    kind: project.data.kind || null,
    cover: toCover(project.data.cover),
  };
}

/** `kind` values (the "Type" select in the admin), in /portfolio section order, with their headings. */
const KIND_SECTIONS: Record<string, string> = {
  "Working project": "Working projects",
  "Personal project": "Personal projects",
  Conference: "Conferences",
};

export function groupByKind(projects: ProjectSummary[]): Array<{ heading: string | null; projects: ProjectSummary[] }> {
  const order = Object.keys(KIND_SECTIONS);
  const groups = new Map<string, ProjectSummary[]>();
  for (const project of projects) {
    const key = project.kind ?? "";
    groups.set(key, [...(groups.get(key) ?? []), project]);
  }
  const rank = (kind: string) => (kind === "" ? Infinity : order.includes(kind) ? order.indexOf(kind) : order.length);
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([kind, items]) => ({ heading: kind ? (KIND_SECTIONS[kind] ?? kind) : null, projects: items }));
}

/** Featured first, then most recently published. */
export function sortProjects<T extends ProjectEntry>(projects: T[]): T[] {
  return [...projects].sort(
    (a, b) =>
      Number(b.data.featured ?? false) - Number(a.data.featured ?? false) ||
      (b.data.publishedAt?.getTime() ?? 0) - (a.data.publishedAt?.getTime() ?? 0),
  );
}
