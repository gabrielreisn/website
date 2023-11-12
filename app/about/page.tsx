/* eslint-disable @next/next/no-img-element */
import site from '@/data/site.json';
import { generateDefaultMetadata } from '@/modules/metadata';
import { Metadata } from 'next';

export const metadata: Metadata = {
  ...generateDefaultMetadata({ path: 'about', title: 'About me' }),
};

export default function About() {
  return (
    <div className="about">
      <h1>About {site.author.name}</h1>
      <img src={site.author.picture} alt="" className="about__image" />
      {site.author.about}
    </div>
  );
}
