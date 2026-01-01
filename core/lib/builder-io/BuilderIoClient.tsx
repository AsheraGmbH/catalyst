'use client';

import dynamic from 'next/dynamic';

// Client component wrapper for Builder.io to prevent build-time processing
// Using dynamic import with ssr: false to prevent Next.js from processing HTML during build
const BuilderIoRenderedHTMLString = dynamic(
  () => import('./BuilderIoRenderedHTMLString'),
  { 
    ssr: false, // Disable SSR to prevent build-time processing
    loading: () => null 
  }
);

export default function BuilderIoClient({ slug }: { slug: string }) {
  return <BuilderIoRenderedHTMLString slug={slug} />;
}
