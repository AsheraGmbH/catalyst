'use client';

import { useEffect, useState } from 'react';

interface BuilderIoClientWrapperProps {
  slug: string;
}

export default function BuilderIoClientWrapper({ slug }: BuilderIoClientWrapperProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    // Only fetch Builder.io content on the client side
    // This prevents Next.js from trying to resolve CSS files during build
    async function fetchBuilderContent() {
      try {
        const response = await fetch(`/api/builder-io?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const data = await response.json();
          setHtml(data.html || '');
        }
      } catch (error) {
        console.warn('[BuilderIoClientWrapper] Failed to fetch content:', error);
      }
    }

    fetchBuilderContent();
  }, [slug]);

  if (!html) {
    return null;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
