import { NextResponse } from 'next/server';
import { getCart } from '~/client/queries/get-cart';
import { getCartId, setCartId } from '~/lib/cart';

export async function POST(req: Request)
{    
    try
    {
        let { cartId } = await req.json();
        if (cartId)
        {
            await setCartId(cartId);
        }

        cartId = await getCartId();
        const cart = await getCart(cartId);
        return NextResponse.json({ cart });
    } catch (error)
    {
        console.error('Failed to fetch cart:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}