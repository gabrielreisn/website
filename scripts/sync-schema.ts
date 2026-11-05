/**
 * Adds collections, fields and taxonomies from seed/seed.json that are missing
 * on a running EmDash site. Additive only: it never renames or deletes.
 *
 * The seed is applied automatically only when a database is first set up, so
 * run this after changing the content model:
 *
 *   pnpm emdash:sync-schema --dry-run                                  # local dev
 *   EMDASH_URL=https://gabrielreis.dev EMDASH_TOKEN=… pnpm emdash:sync-schema
 */
import { readFileSync } from "node:fs";
import { baseUrl, client, dryRun, rawRequest } from "./lib/emdash-client.ts";

type SeedField = {
  slug: string;
  label: string;
  type: string;
  required?: boolean;
  searchable?: boolean;
  indexed?: boolean;
  validation?: Record<string, unknown>;
};
type SeedCollection = {
  slug: string;
  label: string;
  labelSingular?: string;
  description?: string;
  urlPattern?: string;
  supports?: string[];
  admin?: { listColumns?: string[] };
  fields: SeedField[];
};
type SeedTaxonomy = {
  name: string;
  label: string;
  labelSingular?: string;
  hierarchical?: boolean;
  collections?: string[];
};

const seed = JSON.parse(readFileSync(new URL("../seed/seed.json", import.meta.url), "utf8")) as {
  collections: SeedCollection[];
  taxonomies?: SeedTaxonomy[];
};

const prefix = dryRun ? "[dry-run] would" : "→";
console.log(`Syncing schema to ${baseUrl}${dryRun ? " (dry run)" : ""}`);

const existing = new Set((await client.collections()).map((c) => c.slug));
const pendingAdmin: Array<[string, { listColumns?: string[] }]> = [];

for (const collection of seed.collections) {
  let fields = new Set<string>();

  if (existing.has(collection.slug)) {
    const current = await client.collection(collection.slug);
    fields = new Set(current.fields.map((f) => f.slug));
    const currentAdmin = (current as typeof current & { admin?: { listColumns?: string[] } }).admin;
    if (collection.admin && JSON.stringify(collection.admin.listColumns ?? []) !== JSON.stringify(currentAdmin?.listColumns ?? [])) {
      console.log(`${prefix} set "${collection.slug}" admin list columns: ${collection.admin.listColumns?.join(", ")}`);
      // Fields must exist before they can be list columns, so this runs after the fields loop below.
      pendingAdmin.push([collection.slug, collection.admin]);
    }
  } else {
    console.log(`${prefix} create collection "${collection.slug}"`);
    if (!dryRun) {
      await rawRequest("POST", "/schema/collections", {
        slug: collection.slug,
        label: collection.label,
        labelSingular: collection.labelSingular,
        description: collection.description,
        urlPattern: collection.urlPattern,
        supports: collection.supports,
      });
    }
    if (collection.admin) pendingAdmin.push([collection.slug, collection.admin]);
  }

  for (const [index, field] of collection.fields.entries()) {
    if (fields.has(field.slug)) continue;
    console.log(`${prefix} add field "${collection.slug}.${field.slug}" (${field.type})`);
    if (!dryRun) {
      await rawRequest("POST", `/schema/collections/${collection.slug}/fields`, {
        slug: field.slug,
        label: field.label,
        type: field.type,
        required: field.required,
        searchable: field.searchable,
        indexed: field.indexed,
        validation: field.validation ?? null,
        sortOrder: index,
      });
    }
  }
}

for (const [slug, admin] of pendingAdmin) {
  if (!dryRun) await rawRequest("PUT", `/schema/collections/${slug}`, { admin });
}

// The API also returns `collections`, which the client type omits.
const taxonomies = new Map(
  (await client.taxonomies()).map((t) => [t.name, t as typeof t & { collections?: string[] }]),
);

for (const taxonomy of seed.taxonomies ?? []) {
  const current = taxonomies.get(taxonomy.name);
  if (!current) {
    console.log(`${prefix} create taxonomy "${taxonomy.name}" for ${taxonomy.collections?.join(", ")}`);
    if (!dryRun) {
      await rawRequest("POST", "/taxonomies", {
        name: taxonomy.name,
        label: taxonomy.label,
        labelSingular: taxonomy.labelSingular,
        hierarchical: taxonomy.hierarchical ?? false,
        collections: taxonomy.collections,
      });
    }
    continue;
  }
  const attached = current.collections ?? [];
  const missing = (taxonomy.collections ?? []).filter((c) => !attached.includes(c));
  if (missing.length) {
    console.log(`${prefix} attach taxonomy "${taxonomy.name}" to ${missing.join(", ")}`);
    if (!dryRun) {
      // Union, so collections that already use the taxonomy keep it.
      await rawRequest("PUT", `/taxonomies/${taxonomy.name}`, { collections: [...attached, ...missing] });
    }
  }
}

console.log("Schema sync done.");
