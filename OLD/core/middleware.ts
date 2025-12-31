// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { composeMiddlewares } from './middlewares/compose-middlewares';
import { withAuth } from './middlewares/with-auth';
import { withChannelId } from './middlewares/with-channel-id';
import { withIntl } from './middlewares/with-intl';
import { withMakeswift } from './middlewares/with-makeswift';
import { withRoutes } from './middlewares/with-routes';

// Keep the original full pipeline so we don't break home/CMS/pretty routes.
const fullPipeline = composeMiddlewares(
  withAuth,
  withMakeswift,
  withIntl,
  withChannelId,
  withRoutes,
);

// Keep a broad matcher so pretty paths hit withRoutes,
// but we will early-bypass for ID routes below.
export const config = {
  matcher: [
    '/((?!api|admin|_next/static|_next/image|_vercel|favicon\\.ico|white-spinner\\.svg|\\.well-known/apple-developer-merchantid-domain-association|\\.well-known|xmlsitemap\\.php|sitemap\\.xml|robots\\.txt|login/token|(?:images|css|js|fonts)/|[^/]*\\.[^/]*).*)',
  ],
};

export function middleware(req: NextRequest, event: Parameters<typeof fullPipeline>[1]) {
  const pathname = req.nextUrl.pathname;

  // 🚀 Fast path: skip middleware entirely for already-resolved ID routes.
  // Examples: /en/product/123, /en/category/45, /en/brand/7, /en/blog/99
  // (Add non-locale versions if you serve them.)
  if (/^\/(?:[a-z]{2})(?:-[A-Z]{2})?\/(?:product|category|brand|blog)\/\d+(?:\/|$)/.test(pathname)) {
    return NextResponse.next();
  }

  // Everything else uses the original behavior (headers, intl, routes, previews).
  return fullPipeline(req, event);
}
