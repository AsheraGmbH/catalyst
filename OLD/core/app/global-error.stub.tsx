'use client';

export default function GlobalErrorStub() {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-neutral-900 p-6 text-neutral-100">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold">Stub global error boundary</h2>
          <p className="text-sm opacity-70">This fallback renders only during stub builds.</p>
        </div>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
