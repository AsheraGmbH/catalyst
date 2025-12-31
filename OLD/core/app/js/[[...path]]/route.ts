import { createPublicAssetRouteHandlers } from '~/lib/public-assets';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 2592000;

const handlers = createPublicAssetRouteHandlers(['js'] as const);

export const GET = handlers.GET;
export const HEAD = handlers.HEAD;
