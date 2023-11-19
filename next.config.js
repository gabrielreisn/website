/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: [
    {
      source: '/portfolio',
      destination: 'https://gabrielreisnf.notion.site/Gabriel-Portfolio-5d94072f658e4e9e95c8b88e6d103fa4',
      permanent: true,
    },
  ],
};

module.exports = nextConfig;
