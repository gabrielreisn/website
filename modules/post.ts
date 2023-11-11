import { Post } from "@/app/types";

export function calculateExcerpt(post: string) {
  const content = post.replace(/(<([^>]+)>)/gi, '');
  return content.slice(0, content.lastIndexOf(' ', 200)) + '...';
}

export function readingTimeFn(post: string = '') {
  const WORDS_PER_MINUTE = 200;
  //Matches any words
  //https://regex101.com/r/q2Kqjg/6
  const regex = /\w+/g;
  const wordCount = post.match(regex)?.length ?? 0;

  const readingTime = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return { wordCount, readingTime };
}

export function getAllUniqueTags(posts: Array<Post>) {
  const allTags = posts.reduce((allTags, post) => allTags.concat(post.tags), [] as Array<Post['tags']>);
  const uniqueTags = new Set([...allTags]);

  return Array.from(uniqueTags).flat();
}