import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <h1 className="heading-1 mb-4 text-ink">Page Not Found</h1>
      <p className="body-text mb-8 text-ink-muted">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand/90"
      >
        Back to Home
      </Link>
    </div>
  );
}
