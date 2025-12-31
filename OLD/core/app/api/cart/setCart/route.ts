import { NextResponse } from 'next/server';
import { setCartId } from '~/lib/cart';

export async function POST(req: Request)
{    
    try
    {
        let { cartId } = await req.json();
        if (cartId)
        {
            await setCartId(cartId);
        }

        return NextResponse.json({ cartId });
    } catch (error)
    {
        console.error('Failed to fetch cart:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}