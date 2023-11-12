## Next Duo

This project is an adaptation of [Eleventy duo](https://github.com/yinkakun/eleventy-duo) since the project didn't get many updates from the previous years, and Forestry CMS was discontinued

## Features

2. SEO metadata and Open Graph tags
1. Sitemap
1. robots.txt
1. 404 page
1. Tags support
1. Typescript
1. Notion CMS integration

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Notion CMS integration

Most of the process was based on [this article](https://bejamas.io/blog/how-to-create-next-js-blog-using-notion-as-a-cms/) and the required part for the CMS integration will be resumed below:

1. Create a new Notion Database with the follow format
   - Title: Text
   - Slug: Text
   - Date: Date
   - Tags: Multi-select
   - Published: Boolean
   - Description: Rich-text

![Notion Database fields demo](https://github.com/gabrielreisn/website/assets/13686332/a859f77d-6cec-4123-9586-53ccee3942bc)

1.Additionally, you need the ID of the Notion database. It acts as an identifier for the database you want to connect to.

Retrieve it from the database URL by copying the part corresponding to the database_id in the example below.

`https://www.notion.so/{workspace_name}/{database_id}?v={view_id}``

1. Store the `database_id` in your .env file `DATABASE_ID=`
1. Create a new [Notion integration](https://www.notion.so/my-integrations/) with basic info and private access
1. Copy the integration token to your .env file `NOTION_TOKEN=`
1. Connect your integration to the database you created [follow here](https://developers.notion.com/docs/create-a-notion-integration#give-your-integration-page-permissions)

![Notion demo gif](https://files.readme.io/fefc809-permissions.gif)

1. After that, you can start creating pages on your Notion database and they will be automatically fetched and rendered on your website

![Page demo](https://github.com/gabrielreisn/website/assets/13686332/0eafa3ab-473f-4380-a225-8f0e65fab59b)

## Deployment

The project was hosted on [Vercel](https://vercel.com/) as a personal choice, but any other hosting services that supports Nextjs features such as [time-based-revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data) should work, such as [Netlify](https://netlify.com).

- Create a new project on your chosen hosting platform
- Set the build command to `pnpm build`
- Set the output directory to `.next`

Check out my example: [https://gabrielreis.dev](https://gabrielreis.dev)

## License

This project is licensed under the MIT License.

Isn't Jamstack beautiful?

## Todo

1. google analytics
2. json-ld schemas
3. Turn the project into a template
4. convert static pages to MDX
