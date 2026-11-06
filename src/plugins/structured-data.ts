import { definePlugin } from "emdash";
import type { StructuredDataGraph } from "@/lib/structured-data";

/**
 * Replaces EmDash's default JSON-LD with the graph Base.astro built for the page.
 *
 * <EmDashHead> always emits a BlogPosting or WebSite under the id "primary", and
 * dedupes first-wins with plugins ahead of it. A plugin using that id is the only
 * way to replace it rather than emit a second, conflicting block. If the graph is
 * ever missing, this returns null and EmDash's default is used.
 */
export function createPlugin() {
  return definePlugin({
    id: "structured-data",
    version: "1.0.0",
    hooks: {
      "page:metadata": (event) => {
        const { structuredData } = event.page as typeof event.page & { structuredData?: StructuredDataGraph };
        return structuredData ? { kind: "jsonld", id: "primary", graph: structuredData } : null;
      },
    },
  });
}
