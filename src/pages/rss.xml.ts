import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { site } from "@/lib/site";

export const GET: APIRoute = async () => {
  const { entries: posts } = await getEmDashCollection("posts", {
    orderBy: { published_at: "desc" },
    limit: 20,
  });

  const items = posts
    .filter((p) => p.data.publishedAt)
    .map((post) => {
      const url = new URL(`/posts/${post.id}`, site.url).href;
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.data.publishedAt!.toUTCString()}</pubDate>
      <description>${escapeXml(post.data.description ?? "")}</description>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <description>${escapeXml(site.description)}</description>
    <link>${site.url}</link>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
};

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
