type Props = {
  date: string | null;
  isoDate: string | null;
  readingTime: number;
};

export function ReadableDateTime({ date, isoDate, readingTime }: Props) {
  return (
    <>
      {date && isoDate && (
        <>
          <time dateTime={isoDate}>{date}</time>
          <span> | </span>
        </>
      )}
      <span>{readingTime} min read</span>
    </>
  );
}
