/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import '@/css/index.css';

import site from '@/data/site.json';

export const metadata: Metadata = {
  title: 'site.title',
  description: 'Generated by create next app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="" />

        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦞</text></svg>"
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans&display=swap" rel="stylesheet" />

        {/* <meta property="og:title" content="{{  title or site.name | escape }}">
    <meta property="og:site_name" content="{{ site.name }}"/>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="{{ site.url + page.url }}"/>
    <meta name="twitter:card" content="summary_large_image"> 
    <meta name="twitter:creator" content="@{{ site.author.twitterHandle | replace('@', '') }}"/>
    
      <meta name="description" content="{{ desc | escape  }}">
      <meta property="og:description" content="{{ desc | escape }}">
      <meta name="description" content="{{ desc | escape }}"/>    
      <meta property="og:image" content="{{ socialImage | url | absoluteUrl(site.url) }}"/>
      <meta name="twitter:image" content="{{ socialImage | url | absoluteUrl(site.url) }}"/>
    */}
      </head>
      <body>
        <div className="layout-wrapper">
          <header className="header">
            <div className="header__content">
              <h1 className="site-title">
                <Link href="/">{site.name}</Link>
              </h1>

              {site.headerLinks && (
                <nav className="nav">
                  <ul className="nav__list">
                    {site.headerLinks.map((item) => (
                      <li className="nav-item" key={item.text}>
                        <Link href={item.url} aria-current="page" rel="nooopener noreferrer">
                          {item.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </header>

          <main className="main">{children}</main>

          <footer className="footer">
            <div className="footer__content">
              <ul className="hero__social-links">
                {site.socialLinks?.map((item) => {
                  return (
                    <li key={item.text}>
                      <Link href={item.url} target="_blank" rel="nooopener noreferrer">
                        <img className="footer__social--icon" src={item.iconPath} alt={item.text} />
                      </Link>
                    </li>
                  );
                })}

                {site.footerLinks?.map((item) => {
                  return (
                    <li key={item}>
                      <Link href={item} target="_blank" rel="nooopener noreferrer">
                        <img className="footer__social--icon" src={item} alt={item} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
