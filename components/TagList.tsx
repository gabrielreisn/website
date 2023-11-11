import { Post } from '@/app/types';
import Link from 'next/link';

type Props = {
  tags: Post['tags'];
};

export function TagList({ tags }: Props) {
  return tags?.map((tag: string) => (
    <Link key={tag} href={`/tags/${tag}`}>
      #{tag}
    </Link>
  ));
}
