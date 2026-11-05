import type { PostSummary } from "@/lib/posts";
import { ReadableDateTime } from "./ReadableDateTime";
import { TagList } from "./TagList";

export function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return <p className="mt-8 text-muted">Nothing here yet — check back soon 🌱</p>;
  }

  return (
    <ul className="list-none">
      {posts.map((post) => (
        <li key={post.slug} className="flex flex-col border-t border-rule py-12">
          <div>
            <div className="mt-4 space-x-4 text-sm text-muted">
              <ReadableDateTime date={post.date} isoDate={post.isoDate} readingTime={post.readingTime} />
            </div>

            {post.tags.length > 0 && (
              <div className="mt-2 space-x-4 text-sm">
                <TagList tags={post.tags} />
              </div>
            )}
          </div>

          <h3 className="mt-2 text-2xl">
            <a href={`/posts/${post.slug}`} className="font-normal text-ink no-underline hover:text-ink hover:underline">
              {post.title}
            </a>
          </h3>

          {post.excerpt && <p className="mt-4 text-black/80">{post.excerpt}</p>}

          <a className="mt-4 w-fit text-base capitalize" href={`/posts/${post.slug}`}>
            read article
          </a>
        </li>
      ))}
    </ul>
  );
}
