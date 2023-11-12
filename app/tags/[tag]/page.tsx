import { getAllPublished } from '@/clients/notion';
import { PostList } from '@/components/PostList';
import { generateDefaultMetadata } from '@/modules/metadata';
import { getAllUniqueTags } from '@/modules/post';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps) {
  const capitalizedTitle = params.tag
    .split('-')
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
    .join(' ');
  return generateDefaultMetadata({ path: `tags/${[params.tag]}`, title: capitalizedTitle });
}

export async function generateStaticParams() {
  const data = await getAllPublished();

  const tags = getAllUniqueTags(data);

  return tags.map((tag) => ({
    tag: tag,
  }));
}

type PageProps = {
  params: {
    tag: string;
  };
};

async function getFilteredPostsBasedOnTag(tag: string) {
  const data = await getAllPublished();

  return data.filter((post) => post.tags.includes(tag));
}

export default async function tagsPage({ params }: PageProps) {
  const posts = await getFilteredPostsBasedOnTag(params.tag);

  return (
    <>
      <h1>{params.tag}</h1>
      <PostList posts={posts} />
    </>
  );
}
