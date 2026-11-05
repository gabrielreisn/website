import type { ProjectSummary } from "@/lib/posts";

/** Talks link to slides or a recording rather than a site. */
function linkLabel(url: string): string {
  const host = new URL(url).hostname;
  if (host === "docs.google.com" || host.endsWith("slides.com")) return "view slides";
  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("vimeo.com")) return "watch the talk";
  return "visit site";
}

function ProjectLinks({ url, repository }: Pick<ProjectSummary, "url" | "repository">) {
  if (!url && !repository) return null;
  return (
    <div className="mt-4 flex gap-6 text-base">
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {linkLabel(url)}
        </a>
      )}
      {repository && (
        <a href={repository} target="_blank" rel="noopener noreferrer">
          source code
        </a>
      )}
    </div>
  );
}

export function ProjectMeta({ role, period }: Pick<ProjectSummary, "role" | "period">) {
  const parts = [role, period].filter(Boolean);
  if (parts.length === 0) return null;
  return <div className="space-x-4 text-sm text-muted">{parts.join(" | ")}</div>;
}

export function StackList({ stack }: Pick<ProjectSummary, "stack">) {
  if (stack.length === 0) return null;
  return (
    <ul className="flex list-none flex-wrap gap-x-4 gap-y-1 text-sm text-accent">
      {stack.map((tech) => (
        <li key={tech.slug}>#{tech.label}</li>
      ))}
    </ul>
  );
}

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  if (projects.length === 0) {
    return <p className="mt-8 text-muted">Projects are on their way — check back soon 🌱</p>;
  }

  return (
    <ul className="list-none">
      {projects.map((project) => (
        <li key={project.slug} className="flex flex-col border-t border-rule py-12">
          {project.cover && (
            <a href={`/portfolio/${project.slug}`} className="mb-4 block" tabIndex={-1} aria-hidden="true">
              <img
                src={project.cover.src}
                alt=""
                width={project.cover.width}
                height={project.cover.height}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full border border-rule object-cover"
                style={project.cover.color ? { backgroundColor: project.cover.color } : undefined}
              />
            </a>
          )}
          <div className="mt-4">
            <ProjectMeta role={project.role} period={project.period} />
          </div>
          <div className="mt-2">
            <StackList stack={project.stack} />
          </div>

          <h3 className="mt-2 text-2xl">
            <a href={`/portfolio/${project.slug}`} className="font-normal text-ink no-underline hover:text-ink hover:underline">
              {project.featured && <span aria-label="Featured">★ </span>}
              {project.title}
            </a>
          </h3>

          {project.summary && <p className="mt-4 text-black/80">{project.summary}</p>}

          <div className="flex flex-wrap items-baseline gap-x-6">
            <a className="mt-4 w-fit text-base capitalize" href={`/portfolio/${project.slug}`}>
              read case study
            </a>
            <ProjectLinks url={project.url} repository={project.repository} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export { ProjectLinks };
