'use client';

import { runtime } from '~/lib/makeswift/runtime';
import { ReactEmbed } from '@/vibes/soul/primitives/react-embed';

import { Link, Style } from '@makeswift/runtime/controls';
import { useLayoutEffect } from 'react';

interface MakeswiftPageEmbedProps
{
  link: { href?: string; target?: string };
};

function isValidUrl(url: string | undefined): boolean
{
  try
  {
    if (!url) return false;
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
    // eslint-disable-next-line no-unused-vars
  } catch (e)
  {
    return false;
  }
}

function getUpdatedUrl(originalUrl?: string): string | null
{
  if (!originalUrl) return null;

  if (!isValidUrl(originalUrl)) return null;

  // eslint-disable-next-line no-new
  const url = new URL(originalUrl);
  if (typeof window !== 'undefined')
  {
    // eslint-disable-next-line no-new
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => url.searchParams.append(key, value));
  }
  return url.toString();
}

export function LoadingPage({ message }: { message: string })
{
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', color: '#fff' }}>
      {message}
    </div>
  );
}

function MakeswiftPageEmbed({ link }: MakeswiftPageEmbedProps)
{
  const iframeUrl = getUpdatedUrl(link.href);

  // useEffect to hide parent footer
  useLayoutEffect(() =>
  {
    const footer = document.querySelector("footer");
    if (footer)
    {
      footer.style.display = "none";
    }

    return () =>
    {
      if (footer)
      {
        footer.style.display = "block";
      }
    };
  }, []);

  if (!iframeUrl)
  {
    return <LoadingPage message='URL not found' />;
  }

  if (!isValidUrl(link.href))
  {
    return <LoadingPage message='Invalid or missing URL' />;
  }

  return <ReactEmbed iframeUrl={iframeUrl} scrollable={true} />;
}

runtime.registerComponent(MakeswiftPageEmbed, {
  type: 'react-page-embed',
  label: 'Common / Embed Page',
  props: {
    className: Style(),
    link: Link({ label: 'Embed Link' }),
  },
});