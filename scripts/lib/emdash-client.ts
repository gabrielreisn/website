/**
 * EmDash API client for the maintenance scripts.
 *
 *   EMDASH_URL    Site URL (default: http://localhost:4321)
 *   EMDASH_TOKEN  API token (ec_pat_…) — create one in the admin under
 *                 Settings → API Tokens. Not needed for a local dev server,
 *                 which uses EmDash's dev bypass instead.
 */
import { EmDashClient } from "emdash/client";

export const baseUrl = (process.env.EMDASH_URL ?? "http://localhost:4321").replace(/\/$/, "");
const token = process.env.EMDASH_TOKEN;
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseUrl);

if (!token && !isLocal) {
  console.error(`EMDASH_TOKEN is required for ${baseUrl}. Create one in the admin: Settings → API Tokens.`);
  process.exit(1);
}

export const client = new EmDashClient({ baseUrl, token, devBypass: !token && isLocal });

/**
 * Calls an EmDash API route that has no typed client method yet (e.g. creating
 * a taxonomy). Goes through the client's own transport so auth + CSRF apply.
 */
export function rawRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const request = (client as unknown as { request: (m: string, p: string, b?: unknown) => Promise<T> }).request;
  return request.call(client, method, path, body);
}

export const dryRun = process.argv.includes("--dry-run");
