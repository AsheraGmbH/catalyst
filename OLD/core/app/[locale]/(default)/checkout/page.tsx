import { getFormatter, getTranslations } from 'next-intl/server'; 
import { getCart } from '../cart/page-data';
import CheckoutClient from './checkout';
import { CartEmptyState } from '@/vibes/soul/sections/cart';
import { exists } from '~/lib/utils';
import { saveShippingAddress } from './_actions/save-shipping-address';
// import braintree from "braintree"; // ⛔️ Removed: heavy & unused here
import { getCartId } from '~/lib/cart';

// ✅ Checkout must always be fresh/dynamic (per-user cart, payments)
export const dynamic = 'force-dynamic';

//
// (Removed heavy gateway creation — it wasn't used and slowed cold starts)
//
// const gateway = new braintree.BraintreeGateway({
//   environment: braintree.Environment.Sandbox, // or Production
//   merchantId: process.env.BRAINTREE_MERCHANT_ID || 'qcnv747dbxt7nfzs',
//   publicKey: process.env.BRAINTREE_PUBLIC_KEY || 'ywwyn3sjnbrw9bsm',
//   privateKey: process.env.BRAINTREE_PRIVATE_KEY || 'c9bf2061be36d1b4d7b1886bcca7c24e',
// });

export default async function CheckoutPage({ searchParams }: { searchParams: { cartId?: string } })
{
    const cartIdFromUrl = (await searchParams).cartId;
    const cartId = cartIdFromUrl || await getCartId();

    // Keep format + translations + cart fetch parallel for lower TTFB
    try
    {
        if (!cartId)
        {
            return <div className="text-center text-red-500">No cart ID provided</div>;
        }

        const [format, t, data] = await Promise.all([
            getFormatter(),
            getTranslations('Cart'),
            getCart({ cartId }),
        ]);

        const cart = data.site.cart;
        const checkout = data.site.checkout;

        if (!cart)
        {
            return (
                <CartEmptyState
                    cta={{ label: t('Empty.cta'), href: '/shop-all' }}
                    subtitle={t('Empty.subtitle')}
                    title={t('Empty.title')}
                />
            );
        }

        // const { clientToken: braintreeClientToken } = await gateway.clientToken.generate({});

        const lineItems = [...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems];

        const capitalizeFirstLetter = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

        const formattedLineItems = lineItems.map((item) => {
            // Be defensive: new URL() can throw if BC returns a relative URL in some cases
            let safePathname = '/';
            try {
                safePathname = new URL(item.url).pathname;
            } catch {
                safePathname = typeof item.url === 'string' ? item.url : '/';
            }

            return {
                id: item.entityId,
                quantity: item.quantity,
                price: format.number(item.listPrice.value, {
                    style: 'currency',
                    currency: item.listPrice.currencyCode,
                }),
                subtitle: item.selectedOptions
                    .map((option) =>
                    {
                        switch (option.__typename)
                        {
                            case 'CartSelectedMultipleChoiceOption':
                            case 'CartSelectedCheckboxOption':
                                if (option.name?.includes('-checkbox')) return '';
                                return `${option.name}: ${option.value}`;

                            case 'CartSelectedNumberFieldOption':
                                return `${capitalizeFirstLetter(option.name)}: ${option.number}`;

                            case 'CartSelectedMultiLineTextFieldOption':
                            case 'CartSelectedTextFieldOption':
                                return `${capitalizeFirstLetter(option.name)}: ${option.text}`;

                            case 'CartSelectedDateFieldOption':
                                return `${option.name}: ${format.dateTime(new Date(option.date.utc))}`;

                            default:
                                return '';
                        }
                    })
                    .join(', ')
                    .replace(/, $/, ''),
                title: item.name,
                image: { src: item.image?.url || '', alt: item.name },
                href: safePathname,
                selectedOptions: item.selectedOptions,
                productEntityId: item.productEntityId,
                variantEntityId: item.variantEntityId,
            };
        });

        // i need a lineItems with lineItemEntityId and quantity
        const checkoutLineItems = formattedLineItems.map((item) => ({
            lineItemEntityId: item.id,
            quantity: item.quantity,
        }));

        return (
            <CheckoutClient 
                rawData={data}
                processPayment={saveShippingAddress}
                checkoutLineItems={checkoutLineItems}
                braintreeClientToken={''}
                cart={{
                  lineItems: formattedLineItems,
                  total: format.number(checkout?.grandTotal?.value || 0, {
                    style: 'currency',
                    currency: cart.currencyCode,
                  }),
                  grandTotal: checkout?.grandTotal?.value,
                  currency: cart.currencyCode,
                  totalLabel: t('CheckoutSummary.grandTotal'),
                  summaryItems: [
                    // {
                    //   label: t('CheckoutSummary.subTotal'),
                    //   value: format.number(checkout?.subtotal?.value ?? 0, {
                    //     style: 'currency',
                    //     currency: cart.currencyCode,
                    //   }),
                    // },
                    checkout?.taxTotal && {
                      label: 'Tax',
                      value: format.number(checkout.taxTotal.value, {
                        style: 'currency',
                        currency: cart.currencyCode,
                      }),
                    },
                  ].filter(exists),
                }} 
                cartId={cartId} 
            />
        );
    } catch (err)
    {
        return <div className="text-center text-red-500">Failed to fetch cart details</div>;
    }
}
