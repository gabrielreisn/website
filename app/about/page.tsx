import site from '@/data/site.json';

export default function About() {
  return (
    <div className="about">
      <h1>About {site.author.name}</h1>
      <img src={site.author.picture} alt="" className="about__image" />
      {site.author.about}
    </div>
  );
}
