// core/vibes/soul/primitives/react-embed/index.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from '../../../../i18n/routing';
import { getPreferredCurrencyCode } from '~/lib/currency';

export interface Props
{
  /** Can be absolute (https://...) or relative (/faq.html or /faq) */
  iframeUrl: string;
  /** kept only for API compat; we allow scrolling inside the iframe */
  scrollable: boolean;
}

function toLocalHtmlPath(input: string): string
{
  let p = '/';
  try { p = new URL(input).pathname || '/'; } catch { p = input || '/'; }
  if (!p.startsWith('/')) p = '/' + p;
  if (p.endsWith('/')) p += 'index.html';
  if (!/\.[a-z0-9]+$/i.test(p)) p += '.html';
  return p; // "/" -> "/index.html", "/faq" -> "/faq.html"
}

/** Minimal rewrite so srcDoc can resolve assets that were relative (css/, images/, js/). */
function absolutizeAssets(raw: string): string
{
  if (!raw) return '';
  return raw
    // href/src="css/...|images/...|js/..."
    .replace(/\b(href|src)=["'](css|images|js)\/([^"']+)["']/gi,
      (_m, attr, folder, rest) => `${attr}="/${folder}/${rest}"`)
    // srcset lists
    .replace(/\bsrcset=["']([^"']+)["']/gi, (_m, list) =>
    {
      const updated = list.split(',').map(item =>
      {
        const [u, w] = item.trim().split(/\s+/, 2);
        if (/^(css|images|js)\//i.test(u)) return `/${u}${w ? ' ' + w : ''}`;
        return item.trim();
      }).join(', ');
      return `srcset="${updated}"`;
    })
    // inline CSS url(...)
    .replace(/url\(\s*(['"]?)(css|images|js)\/([^"')]+)\1\s*\)/gi,
      (_m, q, folder, rest) => `url(${q}/${folder}/${rest}${q})`);
}

export function ReactEmbed({ iframeUrl }: Readonly<Props>)
{
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState<string>('');

  const localPath = useMemo(() => toLocalHtmlPath(iframeUrl), [iframeUrl]);

  // 1) Fetch the static HTML from /public and prepare srcDoc
  useEffect(() =>
  {
    let cancelled = false;
    setSrcDoc('');
    fetch(localPath, {
      credentials: 'same-origin',
      cache: 'force-cache',
      headers: { Accept: 'text/html' },
    })
      .then(r => (r.ok ? r.text() : ''))
      .then(text => { if (!cancelled) setSrcDoc(absolutizeAssets(text || '')); })
      .catch(() => { if (!cancelled) setSrcDoc(''); });
    return () => { cancelled = true; };
  }, [localPath]);

  // 2) Memoized click handler (stable reference for add/remove)
  const clickHandler = useCallback((ev: MouseEvent) =>
  {
    const a = (ev.target as HTMLElement)?.closest('a') as HTMLAnchorElement | null;
    if (!a) return;

    // Ignore pure hash links
    const rawHref = a.getAttribute('href') || '';
    if (rawHref.trim().startsWith('#')) return;

    let url: URL;
    try { url = new URL(a.href, window.location.origin); } catch { return; }

    // Only handle same-origin navigations; let externals behave normally
    if (url.origin !== window.location.origin) return;

    // Prevent the default navigation INSIDE the iframe so we can delegate to Next Router
    ev.preventDefault();

    // 1) Internal .html pages → keep Catalyst shell and route via Next
    if (/\.html$/i.test(url.pathname))
    {
      const slug = url.pathname
        .replace(/\/index\.html$/i, '/')
        .replace(/\.html$/i, '') || '/';
      router.push(`${slug}${url.search}${url.hash}`);
      return;
    }

    // 2) Everything else (e.g., product pages like /aeon-fountain-pen) → use the app router
    router.push(`${url.pathname}${url.search}${url.hash}`);
  }, [router]);

  // After the iframe loads, intercept links and propagate currency
  const handleLoad = async () =>
  {
    const frame = frameRef.current;
    const doc = frame?.contentDocument || frame?.contentWindow?.document;
    if (!doc) return;

    // Ensure we don’t double-bind on reloads
    doc.removeEventListener('click', clickHandler as any, true);
    doc.addEventListener('click', clickHandler, { capture: true });

    // Set currency (if your Webflow scripts read localStorage)
    try
    {
      const currency = await getPreferredCurrencyCode();
      if (currency) frame?.contentWindow?.localStorage.setItem('selectedCurrency', currency);
    } catch { /* ignore */ }
  };

  useEffect(() =>
  {
    const handleMessage = (event: MessageEvent) =>
    {
      if (event.data?.type === 'checkout')
      {
        const { checkout_url, cartId } = event.data;
        if (checkout_url && typeof checkout_url === 'string' && cartId)
        {
          fetch('/api/cart/setCart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId }),
          })
          setTimeout(() =>
          {
            window.location.href = `/checkout?cartId=${encodeURIComponent(cartId)}`;
          }, 200);
        };
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!srcDoc)
  {
    return <div style={{ width: '100%', minHeight: '40vh' }} />;
  }

  return (
    <iframe
      ref={frameRef}
      srcDoc={srcDoc}
      onLoad={handleLoad}
      // allow top navigation on user click to escape the iframe for product pages, etc.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation-by-user-activation allow-storage-access-by-user-activation"
      id="ashera-embed"
      frameBorder={0}
      scrolling="yes"
      style={{
        width: '100vw',
        height: 'calc(100vh - 68px)', // simple layout
        border: 'none',
        backgroundColor: '#121212',
        display: 'block',
      }}
    />
  );
}
