import Link from 'next/link';

export function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>
        Oops. Page not Found, <Link href="/">Go home</Link>.
      </p>
    </div>
  );
}
