import type { APIRoute } from "astro";
import { site } from "@/lib/site";

// Was a permanent redirect in next.config.js.
export const GET: APIRoute = () => Response.redirect(site.portfolioUrl, 301);
