export type NavLink = { text: string; url: string; external?: boolean };
export type SocialLink = NavLink & { iconPath: string };

export const site = {
  name: "🌿Digital Garden",
  url: "https://gabrielreis.dev",
  description:
    "Gabriel is a Software Engineer, these are notes and reflections about Software Engineering, hobbies and water cooler conversations",
  defaultSocialImage: "https://images.unsplash.com/photo-1589698272390-0501a07619bb",
  author: {
    name: "Gabriel Reis",
    email: "gabrielreisnf@gmail.com",
    picture: "/me.jpeg",
  },
  headerLinks: [
    { text: "Blog", url: "/blog" },
    { text: "About Me", url: "/about" },
    { text: "Portfolio", url: "/portfolio" },
  ] satisfies NavLink[],
  socialLinks: [
    { text: "GitHub", url: "https://github.com/gabrielreisn", iconPath: "/icons/github.svg", external: true },
    { text: "Twitter", url: "https://twitter.com/gabrielreisnf", iconPath: "/icons/twitter.svg", external: true },
    { text: "Linkedin", url: "https://www.linkedin.com/in/gabrielreisnf", iconPath: "/icons/linkedin.svg", external: true },
    { text: "Telegram", url: "https://t.me/gabrielreisn", iconPath: "/icons/telegram.svg", external: true },
  ] satisfies SocialLink[],
} as const;
