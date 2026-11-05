import type { APIRoute } from "astro";
import { getEmDashCollection, getTaxonomyTerms } from "emdash";
import { site } from "@/lib/site";

// Content lives in D1 and changes without a rebuild, so the sitemap is rendered
// per request (was next-sitemap at build time).
export const GET: APIRoute = async () => {
  const [{ entries: posts }, { entries: projects }, tags] = await Promise.all([
    getEmDashCollection("posts", { orderBy: { published_at: "desc" }, limit: 1000 }),
    getEmDashCollection("projects", { orderBy: { published_at: "desc" }, limit: 1000 }),
    getTaxonomyTerms("tag"),
  ]);

  const urls: Array<{ loc: string; lastmod?: string }> = [
    { loc: "/" },
    { loc: "/blog" },
    { loc: "/about" },
    { loc: "/portfolio" },
    ...posts.map((p) => ({ loc: `/posts/${p.id}`, lastmod: p.data.updatedAt.toISOString() })),
    ...projects.map((p) => ({ loc: `/portfolio/${p.id}`, lastmod: p.data.updatedAt.toISOString() })),
    ...tags.map((t) => ({ loc: `/tags/${t.slug}` })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(new URL(u.loc, site.url).href)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
};

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
