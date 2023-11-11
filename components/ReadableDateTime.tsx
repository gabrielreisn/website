import { readingTimeFn } from '@/modules/post';

type Props = {
  date: string;
  markdown: string;
};

export function ReadableDateTime({ date, markdown }: Props) {
  const { readingTime } = readingTimeFn(markdown);
  return (
    <>
      <time dateTime={date}>{date}</time>
      <span> | </span>
      <span>{readingTime} min read</span>
    </>
  );
}
