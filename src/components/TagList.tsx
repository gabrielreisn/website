import type { Tag } from "@/lib/posts";

type Props = {
  tags: Tag[];
  /** "inline": accent #tag links (post list). "pill": outlined chips (blog index). "plain": underlined links (post footer). */
  variant?: "inline" | "pill" | "plain";
};

const variants = {
  inline: "text-accent no-underline hover:text-accent",
  pill: "rounded-full border border-accent px-3 py-1 text-accent no-underline hover:bg-accent-soft hover:text-accent",
  plain: "",
} as const;

export function TagList({ tags, variant = "inline" }: Props) {
  return tags.map((tag) => (
    <a key={tag.slug} href={`/tags/${tag.slug}`} className={variants[variant]}>
      #{tag.label}
    </a>
  ));
}
