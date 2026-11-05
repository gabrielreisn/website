# Notion export

One JSON file per entry, imported with `pnpm emdash:import` (format documented
at the top of `scripts/import-content.ts`). These files are produced from the
Notion MCP server; they are the source of truth for the migration and can be
re-imported safely (entries are matched by slug).
