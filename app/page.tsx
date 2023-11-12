import { getAllPublished, getSinglePost } from '@/clients/notion';
import { Intro } from '@/components/Intro';
import { PostList } from '@/components/PostList';
import { Metadata } from 'next';
import Link from 'next/link';
import { generateDefaultMetadata } from '@/modules/metadata';

export const revalidate = 60;

export const metadata: Metadata = {
  ...generateDefaultMetadata({ title: 'Home' }),
};

export default async function Home() {
  const data = await getAllPublished();

  return (
    <>
      <header className="hero">
        <div className="hero-content">
          <Intro />
        </div>
      </header>

      <section className="post-list__wrapper">
        <h2 className="post-list__heading">Recent Posts</h2>
        <PostList posts={data.slice(-10)} />
      </section>

      <Link className="all-posts-link" href="/blog">
        View All Posts
      </Link>
    </>
  );
}
