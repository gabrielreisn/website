/**
 * Imports entries (exported from Notion) into EmDash. Re-runnable: entries are
 * matched by slug and updated in place.
 *
 * Input: one JSON file per entry in content/notion/ (or paths passed as args):
 *
 *   {
 *     "collection": "posts",                 // or "projects"
 *     "slug": "my-post",
 *     "status": "published",                 // or "draft" (default: published)
 *     "publishedAt": "2023-04-02T00:00:00Z", // keeps the original date
 *     "data": {                              // field values; rich-text fields as Markdown
 *       "title": "My post",
 *       "description": "…",
 *       "content": "## Heading\n\nBody with ![alt](https://…/image.png)"
 *     },
 *     "terms": { "tag": ["React", "Next.js"] }, // labels; created if missing
 *     "source": { "notionUrl": "https://www.notion.so/…" }
 *   }
 *
 * Remote images in Markdown are downloaded and re-uploaded to the EmDash media
 * library, because Notion file URLs are signed and expire after about an hour.
 *
 *   pnpm emdash:import --dry-run                                   # local dev
 *   EMDASH_URL=https://gabrielreis.dev EMDASH_TOKEN=… pnpm emdash:import
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { EmDashApiError } from "emdash/client";
import { baseUrl, client, dryRun, rawRequest, slugify } from "./lib/emdash-client.ts";

type ImportEntry = {
  collection: string;
  slug: string;
  status?: "published" | "draft";
  publishedAt?: string;
  data: Record<string, unknown>;
  terms?: Record<string, string[]>;
  source?: Record<string, string>;
};

const DEFAULT_DIR = new URL("../content/notion/", import.meta.url).pathname;
const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+?)\)\s*$/gm;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = args.length
  ? args
  : readdirSync(DEFAULT_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => join(DEFAULT_DIR, f));

if (files.length === 0) {
  console.log(`No entries to import in ${DEFAULT_DIR}`);
  process.exit(0);
}

console.log(`Importing ${files.length} entr${files.length === 1 ? "y" : "ies"} into ${baseUrl}${dryRun ? " (dry run)" : ""}`);

const termCache = new Map<string, Map<string, string>>(); // taxonomy -> slug -> label
let failures = 0;

for (const file of files) {
  const entry = JSON.parse(readFileSync(file, "utf8")) as ImportEntry;
  const label = `${entry.collection}/${entry.slug}`;
  try {
    const taxonomies = await ensureTerms(entry.terms ?? {});
    const data = await rehostImages(entry.data);
    const status = entry.status ?? "published";
    const existing = await findBySlug(entry.collection, entry.slug);

    if (dryRun) {
      console.log(`[dry-run] would ${existing ? "update" : "create"} ${label} (${status})`);
      continue;
    }

    // `taxonomies` and `publishedAt` are accepted by the API but missing from
    // the client's input types, hence the casts.
    const body = { data, slug: entry.slug, taxonomies, publishedAt: entry.publishedAt };
    const item = existing
      ? await client.update(entry.collection, existing, body as Parameters<typeof client.update>[2])
      : await client.create(entry.collection, { ...body, status: "draft" } as Parameters<typeof client.create>[1]);

    if (status === "published") {
      await rawRequest("POST", `/content/${entry.collection}/${item.id}/publish`, {
        publishedAt: entry.publishedAt,
      });
    }
    console.log(`✓ ${existing ? "updated" : "created"} ${label} (${status})`);
  } catch (error) {
    failures++;
    console.error(`✗ ${label} (${basename(file)}): ${error instanceof Error ? error.message : error}`);
  }
}

if (failures) {
  console.error(`${failures} entr${failures === 1 ? "y" : "ies"} failed.`);
  process.exit(1);
}
console.log("Import done.");

// ── helpers ───────────────────────────────────────────────────────────────

async function findBySlug(collection: string, slug: string): Promise<string | null> {
  try {
    return (await client.get(collection, slug, { raw: true })).id;
  } catch (error) {
    if (error instanceof EmDashApiError && error.status === 404) return null;
    throw error;
  }
}

/** Ensures every term exists; returns { taxonomy: [termSlug, …] } for the API. */
async function ensureTerms(terms: Record<string, string[]>): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  for (const [taxonomy, labels] of Object.entries(terms)) {
    let known = termCache.get(taxonomy);
    if (!known) {
      const { items } = await client.terms(taxonomy, { limit: 1000 });
      known = new Map(items.map((t) => [t.slug, t.label]));
      termCache.set(taxonomy, known);
    }
    result[taxonomy] = [];
    for (const label of labels) {
      const slug = slugify(label);
      if (!slug) continue;
      if (!known.has(slug)) {
        console.log(`${dryRun ? "[dry-run] would create" : "→ creating"} ${taxonomy} term "${label}" (${slug})`);
        if (!dryRun) await client.createTerm(taxonomy, { slug, label });
        known.set(slug, label);
      }
      result[taxonomy].push(slug);
    }
  }
  return result;
}

/** Downloads remote images referenced from Markdown fields and uploads them to EmDash media. */
async function rehostImages(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...data };
  for (const [field, value] of Object.entries(data)) {
    if (typeof value !== "string" || !value.includes("![")) continue;
    let markdown = value;
    for (const [line, alt, url] of value.matchAll(IMAGE_LINE)) {
      if (!/^https?:\/\//.test(url) || url.startsWith(baseUrl)) continue;
      if (dryRun) {
        console.log(`[dry-run] would re-host image ${url.slice(0, 80)}…`);
        continue;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`image download failed (${response.status}): ${url.slice(0, 120)}`);
      const type = response.headers.get("content-type") ?? "application/octet-stream";
      const filename = imageFilename(url, type);
      const media = await client.mediaUpload(new Uint8Array(await response.arrayBuffer()), filename, {
        alt: alt || undefined,
        contentType: type,
      });
      // The API returns `url` / `storageKey`; the client's MediaItem type still says `key`.
      // Uploads are de-duplicated server-side by content hash, so re-runs don't pile up copies.
      const stored = media as typeof media & { url?: string; storageKey?: string };
      const src = stored.url ?? `/_emdash/api/media/file/${stored.storageKey ?? media.key}`;
      markdown = markdown.replace(line, `![${alt}](${src})`);
      console.log(`  ↳ re-hosted image as ${filename}`);
    }
    out[field] = markdown;
  }
  return out;
}

function imageFilename(url: string, contentType: string): string {
  const name = basename(new URL(url).pathname) || "image";
  if (extname(name)) return decodeURIComponent(name);
  const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
  return `${decodeURIComponent(name)}.${ext}`;
}
