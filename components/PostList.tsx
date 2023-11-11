import { calculateExcerpt } from '@/modules/post';
import Link from 'next/link';
import { ReadableDateTime } from './ReadableDateTime';
import { Post } from '@/app/types';
import { TagList } from './TagList';

export function PostList({ posts }: { posts: Array<Post> }) {
  return (
    <ul className="post-list">
      {posts?.map((post) => (
        <li className="post-list__item" key={post.date}>
          <div>
            <div className="post-list__meta">
              <ReadableDateTime date={post.date} markdown={post.markdown.parent} />
            </div>

            <div className="post-list__tags">
              <TagList tags={post.tags} />
            </div>
          </div>

          <h3 className="post-list__title">
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h3>

          <p className="post-list__excerpt">{calculateExcerpt(post.markdown.parent)}</p>

          <Link className="post-list__read-more" href={`/posts/${post.slug}`}>
            read article
          </Link>
        </li>
      ))}
    </ul>
  );
}
