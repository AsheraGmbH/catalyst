'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-neutral-900 p-6 text-neutral-100">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold">Something went wrong.</h2>
          <p className="text-sm opacity-70">
            {process.env.CATALYST_STUB_MODE === 'true'
              ? 'Global error fallback rendered in stub mode. '
              : 'Please try again later.'}
          </p>
          <button
            className="rounded bg-neutral-800 px-3 py-2 text-xs font-medium"
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
          {process.env.NODE_ENV !== 'production' && error?.digest && (
            <code className="block rounded bg-neutral-800 px-3 py-2 text-xs">{error.digest}</code>
          )}
        </div>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
