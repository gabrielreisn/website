/**
 * Cloudflare infrastructure for gabrielreis.dev.
 *
 *   D1 database  ── EmDash content, users, settings      (binding: DB)
 *   R2 bucket    ── EmDash media uploads                  (binding: MEDIA)
 *   KV namespace ── Astro sessions                        (binding: SESSION)
 *   Worker       ── Astro SSR + EmDash admin, built and deployed with wrangler
 *   Custom domains for the Worker
 *
 * Pulumi owns the stateful resources and the domains. The Worker bundle is
 * produced by the Astro build (many ES modules + static assets), so we hand
 * it to `wrangler deploy` — fed with the IDs Pulumi just created — rather than
 * re-implementing Wrangler's upload logic in Pulumi resources.
 */
import * as cloudflare from "@pulumi/cloudflare";
import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { parse as parseJsonc } from "jsonc-parser";

const config = new pulumi.Config();
const accountId = config.require("accountId");
const zoneId = config.get("zoneId") ?? "";
const domains = config.getObject<string[]>("domains") ?? [];
const workerName = config.get("workerName") ?? "gabrielreis-dev";
const d1LocationHint = config.get("d1LocationHint") ?? "enam";
const protectData = config.getBoolean("protectData") ?? true;
const encryptionKey = config.requireSecret("emdashEncryptionKey");

// Optional: pass the token through Pulumi config instead of CLOUDFLARE_API_TOKEN.
const cfConfig = new pulumi.Config("cloudflare");
const apiToken = cfConfig.getSecret("apiToken");

if (domains.length > 0 && !zoneId) {
  throw new Error("`zoneId` must be set when `domains` is configured.");
}

const repoRoot = path.resolve(__dirname, "..");

// ── Stateful resources ─────────────────────────────────────────────────────

const db = new cloudflare.D1Database(
  "db",
  {
    accountId,
    name: `${workerName}-db`,
    primaryLocationHint: d1LocationHint,
    // EmDash's docs advise against read replicas combined with placement hints.
    readReplication: { mode: "disabled" },
  },
  { protect: protectData },
);

const media = new cloudflare.R2Bucket(
  "media",
  {
    accountId,
    name: `${workerName}-media`,
  },
  { protect: protectData },
);

const sessions = new cloudflare.WorkersKvNamespace("sessions", {
  accountId,
  title: `${workerName}-sessions`,
});

// ── Wrangler config for production ─────────────────────────────────────────
// Start from the checked-in wrangler.jsonc (compat date, flags, crons) and
// overlay the real resource IDs.

const baseWrangler = parseJsonc(readFileSync(path.join(repoRoot, "wrangler.jsonc"), "utf8"));
const siteUrl = domains.length > 0 ? `https://${domains[0]}` : undefined;

const wranglerConfig = pulumi
  .all([db.name, db.uuid, media.name, sessions.id])
  .apply(([dbName, dbId, bucketName, kvId]) =>
    JSON.stringify(
      {
        ...baseWrangler,
        $schema: "node_modules/wrangler/config-schema.json",
        name: workerName,
        // Keep *.workers.dev reachable until a custom domain is attached.
        workers_dev: domains.length === 0,
        preview_urls: false,
        d1_databases: [{ binding: "DB", database_name: dbName, database_id: dbId }],
        r2_buckets: [{ binding: "MEDIA", bucket_name: bucketName }],
        kv_namespaces: [{ binding: "SESSION", id: kvId }],
        images: { binding: "IMAGES" },
        observability: { enabled: true },
        vars: {
          ...(baseWrangler.vars ?? {}),
          ...(siteUrl ? { EMDASH_SITE_URL: siteUrl } : {}),
        },
      },
      null,
      2,
    ),
  );

// ── Build + deploy ─────────────────────────────────────────────────────────
// Re-run whenever app sources or the generated config change.

const sourceHash = hashPaths(repoRoot, [
  "src",
  "public",
  "seed",
  "astro.config.mjs",
  "emdash-env.d.ts",
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "wrangler.jsonc",
]);

const deployScript = `
set -euo pipefail
printf '%s' "$WRANGLER_CONFIG_JSON" > "$WRANGLER_CONFIG"
secrets_file="$(mktemp)"
trap 'rm -f "$secrets_file"' EXIT
node -e 'require("fs").writeFileSync(process.argv[1], JSON.stringify({ EMDASH_ENCRYPTION_KEY: process.env.EMDASH_ENCRYPTION_KEY }))' "$secrets_file"
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler deploy --secrets-file "$secrets_file"
`;

const deploy = new command.local.Command(
  "worker-deploy",
  {
    dir: repoRoot,
    interpreter: ["/bin/bash", "-c"],
    create: deployScript,
    update: deployScript,
    delete: `pnpm exec wrangler delete --name ${workerName} --force`,
    environment: {
      CLOUDFLARE_ACCOUNT_ID: accountId,
      WRANGLER_CONFIG: "wrangler.production.jsonc",
      WRANGLER_CONFIG_JSON: wranglerConfig,
      EMDASH_ENCRYPTION_KEY: encryptionKey,
      ...(apiToken ? { CLOUDFLARE_API_TOKEN: apiToken } : {}),
    },
    triggers: [sourceHash, wranglerConfig],
    logging: "stdoutAndStderr",
  },
  { dependsOn: [db, media, sessions], additionalSecretOutputs: ["stdout", "stderr"] },
);

// ── Custom domains ─────────────────────────────────────────────────────────

const customDomains = domains.map(
  (hostname) =>
    new cloudflare.WorkersCustomDomain(
      `domain-${hostname}`,
      { accountId, zoneId, hostname, service: workerName },
      { dependsOn: [deploy] },
    ),
);

// ── Outputs ────────────────────────────────────────────────────────────────

export const worker = workerName;
export const d1DatabaseId = db.uuid;
export const r2BucketName = media.name;
export const sessionKvId = sessions.id;
export const urls = customDomains.length
  ? customDomains.map((d) => pulumi.interpolate`https://${d.hostname}`)
  : [`https://${workerName}.<your-subdomain>.workers.dev`];
export const adminUrl = siteUrl ? `${siteUrl}/_emdash/admin` : "<workers.dev URL>/_emdash/admin";

// ── Helpers ────────────────────────────────────────────────────────────────

function hashPaths(root: string, entries: string[]): string {
  const hash = createHash("sha256");
  const visit = (rel: string) => {
    const abs = path.join(root, rel);
    if (!existsSync(abs)) return;
    if (statSync(abs).isDirectory()) {
      for (const child of readdirSync(abs).sort()) visit(path.join(rel, child));
    } else {
      hash.update(rel).update(readFileSync(abs));
    }
  };
  entries.forEach(visit);
  return hash.digest("hex");
}
