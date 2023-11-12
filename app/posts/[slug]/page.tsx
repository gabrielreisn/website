import { ReadableDateTime } from '@/components/ReadableDateTime';
import { TagList } from '@/components/TagList';
import { getAllPublished, getSinglePost } from '@/clients/notion';
import ReactMarkdown from 'react-markdown';
import { generateDefaultMetadata } from '@/modules/metadata';

export const revalidate = 60;

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps) {
  const { title, description } = await getSinglePost(params.slug);

  return generateDefaultMetadata({ path: `posts/${[params.slug]}`, title, description });
}

export async function generateStaticParams() {
  const posts = await getAllPublished();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: PageProps) {
  const post = await getSinglePost(params.slug);

  const { title, date, tags, markdown } = post;
  return (
    <article className="post">
      <header className="post__header">
        <h1>{title}</h1>
        <div className="post__details">
          <ReadableDateTime date={date} markdown={markdown.parent} />
        </div>
      </header>

      <main className="post__content">
        <ReactMarkdown>{post.markdown.parent}</ReactMarkdown>
      </main>

      <aside className="post__aside">
        <div className="post__tags">
          <TagList tags={tags} />
        </div>
      </aside>
    </article>
  );
}
