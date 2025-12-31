import type { PropsWithChildren } from 'react';

import '../globals.css';

export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Catalyst Stub Build',
};

interface Props extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ params, children }: Props) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}

export function generateStaticParams() {
  return [{ locale: 'en-US' }];
}
