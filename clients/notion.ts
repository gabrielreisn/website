import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md';

export const notionClient = new Client({
  auth: process.env.NOTION_TOKEN,
})

const n2m = new NotionToMarkdown({ notionClient: notionClient });


function getToday(dateString: string) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const date = dateString ? new Date(dateString) : new Date()

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let today = `${month} ${day}, ${year}`;

  return today;
}

//@TODO: add Notion API typings here
const getPageMetaData = async (post: any) => {
  const getTags = (tags: Array<{ name: string }>) => {
    const allTags = tags.map((tag) => {
      return tag.name;
    });

    return allTags;
  };

  const mdBlocks = await n2m.pageToMarkdown(post.id);
  const mdString = n2m.toMarkdownString(mdBlocks);

  return {
    id: post.id,
    markdown: mdString,
    title: post.properties.Title.title[0].plain_text,
    tags: getTags(post.properties.Tags.multi_select),
    description: post.properties.Description.rich_text[0].plain_text,
    date: getToday(post.properties.Date.last_edited_time),
    slug: post.properties.Slug.rich_text[0].plain_text,
  };
};


export const getAllPublished = async () => {
  const posts = await notionClient.databases.query({
    database_id: process.env.DATABASE_ID ?? '',
    filter: {
      property: 'Published',
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
  });

  const allPosts = posts.results;

  return Promise.all(allPosts.map((post) => {
    return getPageMetaData(post);
  }))
};

export const getSinglePost = async (slug: string) => {
  const response = await notionClient.databases.query({
    database_id: process.env.DATABASE_ID ?? '',
    filter: {
      property: 'Slug',
      formula: {
        string: {
          equals: slug,
        },
      },
    },
  });

  const page = response.results[0];

  const pageData = await getPageMetaData(page)

  return {
    ...pageData
  };
};