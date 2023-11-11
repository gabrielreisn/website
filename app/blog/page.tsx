import { getAllPublished } from '@/clients/notion';
import { PostList } from '@/components/PostList';
import { TagList } from '@/components/TagList';
import { getAllUniqueTags } from '@/modules/post';

export default async function BlogPage() {
  const data = await getAllPublished();

  const tags = getAllUniqueTags(data);

  return (
    <>
      <h1>All Posts</h1>
      <div className="tags">{<TagList tags={tags} />}</div>
      <PostList posts={data.slice(-10)} />
    </>
  );
}
