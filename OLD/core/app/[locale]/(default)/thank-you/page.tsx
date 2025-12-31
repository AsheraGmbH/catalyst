import { redirect } from "next/navigation";
import { decryptObject } from "./_utils/order";
import ThankYouPageClient from "./thank-you";
import { getFormatter, getTranslations } from "next-intl/server";
import { exists } from "~/lib/utils";

// The thank-you page contains order-specific details and must always be dynamic.
export const dynamic = 'force-dynamic';

const { BIGCOMMERCE_STORE_HASH, BIGCOMMERCE_ACCESS_TOKEN } = process.env;
const storeHash = BIGCOMMERCE_STORE_HASH!;
const accessToken = BIGCOMMERCE_ACCESS_TOKEN!;

export default async function ThankYouPage({ searchParams }: { searchParams: { orderId?: string } })
{
    const t = await getTranslations('Cart');
    const format = await getFormatter();
    const encryptedOrderId = (await searchParams).orderId;

    if (!encryptedOrderId) {
        // redirect to home
        redirect("/");
    }

    const decrypt = await decryptObject<{ orderId: string; cart: any }>(encryptedOrderId);

    const { success, result } = decrypt;

    if(!success || !result) {
        // redirect to home
        redirect("/");
    }

    if (!result.cart) {
        // redirect to home
        redirect("/");
    }

    const { orderId, cart: cartData } = result;

    const data = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}/shipping_addresses`, {
        method: "GET",
        headers: {
            "X-Auth-Token": accessToken,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
    });

    const shippingInfoRes = await data.json();

    if (shippingInfoRes.length === 0) {
        // redirect to home
        redirect("/");
    }

    if (!shippingInfoRes[0]?.id) {
        // redirect to home
        redirect("/");
    }

    const cart = cartData.site.cart;
    const checkout = cartData.site.checkout;

    const capitalizeFirstLetter = (string: string) =>
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    console.log(cart);
    const lineItems = [...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems];

    const formattedLineItems = lineItems.map((item) => ({
        id: item.entityId,
        quantity: item.quantity,
        price: format.number(item.listPrice.value, {
            style: 'currency',
            currency: item.listPrice.currencyCode,
        }),
        subtitle: item.selectedOptions
            .map((option: any) =>
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
        href: new URL(item.url).pathname,
        selectedOptions: item.selectedOptions,
        productEntityId: item.productEntityId,
        variantEntityId: item.variantEntityId,
    }));

    return (
        <ThankYouPageClient
            rawData={cartData}
            cartId={cartData?.site?.cart?.entityId}
            orderId={orderId}
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
                {
                    label: t('CheckoutSummary.subTotal'),
                    value: format.number(checkout?.subtotal?.value ?? 0, {
                    style: 'currency',
                    currency: cart.currencyCode,
                    }),
                },
                checkout?.taxTotal && {
                    label: 'Tax',
                    value: format.number(checkout.taxTotal.value, {
                    style: 'currency',
                    currency: cart.currencyCode,
                    }),
                },
                ].filter(exists),
            }} 
            shippingInfo={shippingInfoRes[0]}
        />
    )
}