import { getAllPublished } from '@/clients/notion';
import { PostList } from '@/components/PostList';
import { getAllUniqueTags } from '@/modules/post';
import { notFound } from 'next/navigation';

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
