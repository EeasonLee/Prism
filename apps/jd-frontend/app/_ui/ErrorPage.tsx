import Link from 'next/link';

interface ErrorPageProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorPage({
  title,
  message,
  actionLabel = 'Retry',
  onAction,
  backHref,
  backLabel = 'Go Back',
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        <p className="mt-4 text-lg text-gray-600">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          {onAction && (
            <button
              onClick={onAction}
              className="rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              {actionLabel}
            </button>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
