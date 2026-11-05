import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="w-full px-4 pb-16">
      <div className="mx-auto flex w-full max-w-content flex-col items-center border-t border-rule text-base">
        <ul className="mt-8 flex list-none flex-wrap justify-evenly uppercase">
          {site.socialLinks.map((item) => (
            <li key={item.text} className="mx-1 max-w-12">
              <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.text}>
                <img className="h-8 w-8" src={item.iconPath} alt={item.text} width={32} height={32} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
