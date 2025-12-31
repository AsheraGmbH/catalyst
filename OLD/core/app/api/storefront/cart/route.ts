import { NextResponse } from 'next/server';

import { getCart } from '~/client/queries/get-cart';
import { getCartId } from '~/lib/cart';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function pickCartId(searchParams: URLSearchParams): string | undefined {
  const candidates = [
    searchParams.get('cartId'),
    searchParams.get('id'),
    searchParams.get('entityId'),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

function pickChannelId(request: Request): string | undefined {
  const header = request.headers.get('x-bc-channel-id') ?? '';
  const candidate = header.trim();

  return candidate.length > 0 ? candidate : undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedCartId = pickCartId(url.searchParams);
    const cookieCartId = await getCartId();
    const cartId = requestedCartId ?? cookieCartId;

    if (!cartId) {
      return NextResponse.json({ cart: null }, { status: 200 });
    }

    const channelId = pickChannelId(request);
    const cart = await getCart(cartId, channelId);

    return NextResponse.json({ cart: cart ?? null }, { status: 200 });
  } catch (error) {
    console.error('Failed to resolve storefront cart API request', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}
