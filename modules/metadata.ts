
import site from '@/data/site.json'

type Params = {
  path?: string
  description?: string
  title: string
}

export function generateDefaultMetadata(params: Params) {
  const { path, title, description } = params


  const metaTitle = `${title} | ${site.name}`
  const metaDescription = description ?? 'Gabriel is a Software Engineer, these are notes and reflections about Software Engineering, hobbies and water cooler conversations'
  const metaCanonical = path ? `${site.url}/${path}` : site.url

  return {
    title: metaTitle,
    alternates: {
      canonical: metaCanonical,
    },
    description:
      metaDescription,
    keywords: ['Next.js', 'React', 'Typescript', 'Developer', 'Software engineering'],
    authors: [{ name: 'Gabriel Reis', url: 'https://gabrielreis.dev/about' }],
    creator: 'Gabriel Reis',
    publisher: 'Gabriel Reis',
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: metaCanonical,
      images: [
        {
          url: site.defaultSocialImage,
        }
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      creator: '@gabrielreisnf',
      images: [site.defaultSocialImage],
    },
  }
}