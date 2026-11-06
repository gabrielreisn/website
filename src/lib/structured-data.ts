import type { PostSummary, ProjectSummary } from "@/lib/posts";
import { site } from "@/lib/site";

/**
 * JSON-LD for every public page. Each page gets one connected @graph: the
 * WebSite and Person nodes below, plus the nodes built here for that page.
 * Base.astro hands the graph to src/plugins/structured-data.ts, which swaps it
 * in for EmDash's default output.
 */

export type SchemaNode = Record<string, unknown>;
export type StructuredDataGraph = { "@context": string; "@graph": SchemaNode[] };

type Crumb = { name: string; url: string };

const LANGUAGE = "en";
/** Search engines show this as the site name, so the emoji stays out of it. */
const SITE_NAME = site.name.replace(/\p{Extended_Pictographic}/gu, "").trim();

const absolute = (path: string) => new URL(path, site.url).href;

const HOME_URL = absolute("/");
const BLOG_URL = absolute("/blog");
const ABOUT_URL = absolute("/about");
const PORTFOLIO_URL = absolute("/portfolio");

const WEBSITE_ID = `${HOME_URL}#website`;
const PERSON_ID = `${HOME_URL}#person`;
const BLOG_ID = `${BLOG_URL}#blog`;

const person = { "@id": PERSON_ID };
const website = { "@id": WEBSITE_ID };

const HOME_CRUMB: Crumb = { name: "Home", url: HOME_URL };
const BLOG_CRUMB: Crumb = { name: "Blog", url: BLOG_URL };
const PORTFOLIO_CRUMB: Crumb = { name: "Portfolio", url: PORTFOLIO_URL };

const articleId = (url: string) => `${url}#article`;
const postUrl = (slug: string) => absolute(`/posts/${slug}`);
const projectUrl = (slug: string) => absolute(`/portfolio/${slug}`);

/** Validators prefer absent keys over nulls and empty lists. */
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as T;
  if (value === null || typeof value !== "object") return value;
  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  return Object.fromEntries(entries.map(([k, v]) => [k, clean(v)])) as T;
}

export function structuredDataGraph(nodes: SchemaNode[]): StructuredDataGraph {
  return clean({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: HOME_URL,
        name: SITE_NAME,
        description: site.description,
        inLanguage: LANGUAGE,
        author: person,
        publisher: person,
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: site.author.name,
        url: ABOUT_URL,
        image: absolute(site.author.picture),
        jobTitle: site.author.jobTitle,
        sameAs: site.socialLinks.map((link) => link.url),
      },
      ...nodes,
    ],
  });
}

type WebPageInput = {
  type?: string;
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  mainEntity?: string;
  /** Ancestors between Home and this page; Home itself is added here. */
  parents?: Crumb[];
  isHome?: boolean;
};

/** The page node, plus its BreadcrumbList on anything but the home page. */
function webPage({ type = "WebPage", url, name, description, image, datePublished, dateModified, mainEntity, parents = [], isHome }: WebPageInput): SchemaNode[] {
  const pageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const page: SchemaNode = {
    "@type": type,
    "@id": pageId,
    url,
    name,
    description,
    primaryImageOfPage: image ? { "@type": "ImageObject", url: image } : null,
    datePublished,
    dateModified,
    inLanguage: LANGUAGE,
    isPartOf: website,
    mainEntity: mainEntity ? { "@id": mainEntity } : null,
    breadcrumb: isHome ? null : { "@id": breadcrumbId },
  };
  if (isHome) return [page];

  const crumbs = [HOME_CRUMB, ...parents, { name, url }];
  return [
    page,
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: crumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  ];
}

function itemList(id: string, items: Array<{ name: string; url: string }>): SchemaNode {
  return {
    "@type": "ItemList",
    "@id": id,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/** Fallback for pages without a dedicated builder. */
export function pageSchema(input: { url: string; name: string; description?: string | null }): SchemaNode[] {
  return webPage({ ...input, url: absolute(input.url) });
}

export function homeSchema(): SchemaNode[] {
  return webPage({ url: HOME_URL, name: SITE_NAME, description: site.description, isHome: true });
}

export function blogSchema(input: { name: string; posts: PostSummary[] }): SchemaNode[] {
  return [
    ...webPage({ type: "CollectionPage", url: BLOG_URL, name: input.name, description: site.description, mainEntity: BLOG_ID }),
    {
      "@type": "Blog",
      "@id": BLOG_ID,
      url: BLOG_URL,
      name: `${SITE_NAME} blog`,
      description: site.description,
      inLanguage: LANGUAGE,
      isPartOf: website,
      author: person,
      publisher: person,
      blogPost: input.posts.map((post) => ({
        "@type": "BlogPosting",
        "@id": articleId(postUrl(post.slug)),
        url: postUrl(post.slug),
        headline: post.title,
        description: post.excerpt,
        datePublished: post.isoDate,
        author: person,
      })),
    },
  ];
}

export function tagSchema(input: { slug: string; label: string; description: string; posts: PostSummary[] }): SchemaNode[] {
  const url = absolute(`/tags/${input.slug}`);
  const listId = `${url}#posts`;
  return [
    ...webPage({ type: "CollectionPage", url, name: input.label, description: input.description, mainEntity: listId, parents: [BLOG_CRUMB] }),
    itemList(listId, input.posts.map((post) => ({ name: post.title, url: postUrl(post.slug) }))),
  ];
}

export function portfolioSchema(input: { description: string; projects: ProjectSummary[] }): SchemaNode[] {
  const listId = `${PORTFOLIO_URL}#projects`;
  return [
    ...webPage({ type: "CollectionPage", url: PORTFOLIO_URL, name: "Portfolio", description: input.description, mainEntity: listId }),
    itemList(listId, input.projects.map((project) => ({ name: project.title, url: projectUrl(project.slug) }))),
  ];
}

export function aboutSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
}): SchemaNode[] {
  const url = absolute(input.url);
  return webPage({
    ...input,
    type: "ProfilePage",
    url,
    image: input.image ? absolute(input.image) : null,
    mainEntity: PERSON_ID,
  });
}

export function postSchema(input: {
  url: string;
  headline: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  tags: string[];
  wordCount: number;
  readingMinutes: number;
}): SchemaNode[] {
  const url = absolute(input.url);
  const id = articleId(url);
  return [
    ...webPage({
      url,
      name: input.headline,
      description: input.description,
      datePublished: input.datePublished,
      dateModified: input.dateModified,
      mainEntity: id,
      parents: [BLOG_CRUMB],
    }),
    {
      "@type": "BlogPosting",
      "@id": id,
      url,
      headline: input.headline,
      description: input.description,
      image: input.image,
      datePublished: input.datePublished,
      dateModified: input.dateModified ?? input.datePublished,
      inLanguage: LANGUAGE,
      keywords: input.tags,
      wordCount: input.wordCount,
      timeRequired: `PT${input.readingMinutes}M`,
      author: person,
      publisher: person,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      isPartOf: { "@type": "Blog", "@id": BLOG_ID, url: BLOG_URL, name: `${SITE_NAME} blog` },
    },
  ];
}

/** Credits the site owner on a work, wrapping the role name when there is one. */
function credit(property: "author" | "contributor", role: string | null): SchemaNode {
  return role ? { "@type": "Role", roleName: role, [property]: person } : person;
}

export function projectSchema(input: {
  url: string;
  name: string;
  description?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  project: ProjectSummary;
}): SchemaNode[] {
  const { project } = input;
  const url = absolute(input.url);
  const id = `${url}#project`;

  // Client and employer work is credited as a contribution: the site owner
  // worked on Splunk, but isn't its author. Only their own projects and talks
  // get `author`.
  const isOwnWork = project.kind === "Personal project" || project.kind === "Conference";
  const isSource = project.kind === "Personal project" && Boolean(project.repository);
  const creditProperty = isOwnWork ? "author" : "contributor";

  return [
    ...webPage({
      url,
      name: input.name,
      description: input.description,
      datePublished: input.datePublished,
      dateModified: input.dateModified,
      mainEntity: id,
      parents: [PORTFOLIO_CRUMB],
    }),
    {
      // Not SoftwareApplication: Google's rich result for it requires ratings
      // and offers these projects don't have, so it would only report errors.
      "@type": isSource ? "SoftwareSourceCode" : "CreativeWork",
      "@id": id,
      name: project.title,
      description: input.description,
      url: project.url ?? project.repository ?? url,
      image: project.cover ? absolute(project.cover.src) : null,
      genre: project.kind === "Conference" ? "Conference talk" : null,
      codeRepository: project.repository,
      keywords: project.stack.map((tech) => tech.label),
      temporalCoverage: project.period,
      inLanguage: LANGUAGE,
      [creditProperty]: credit(creditProperty, project.role),
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
  ];
}
