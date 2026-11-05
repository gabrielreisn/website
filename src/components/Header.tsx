import { site } from "@/lib/site";

export function Header({ currentPath }: { currentPath: string }) {
  return (
    <header className="mb-16 w-full uppercase">
      <div className="mx-auto mt-4 flex max-w-content flex-wrap items-center justify-between border-b border-rule p-4">
        <h1 className="my-4 text-xl">
          <a href="/" className="text-ink-strong no-underline hover:text-ink">
            {site.name}
          </a>
        </h1>

        <nav aria-label="Main">
          <ul className="flex list-none gap-8 py-2 text-base">
            {site.headerLinks.map((item) => (
              <li key={item.text}>
                <a
                  href={item.url}
                  className="my-4 text-muted no-underline hover:text-ink"
                  aria-current={currentPath.startsWith(item.url) ? "page" : undefined}
                  {...("external" in item && item.external ? { rel: "noopener noreferrer" } : {})}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
