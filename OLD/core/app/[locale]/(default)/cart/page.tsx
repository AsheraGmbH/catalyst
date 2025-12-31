import { Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';

import { Cart as CartComponent, CartEmptyState } from '@/vibes/soul/sections/cart';
import { getCartId } from '~/lib/cart';
import { exists } from '~/lib/utils';

import { redirectToCheckout } from './_actions/redirect-to-checkout';
import { updateLineItem } from './_actions/update-line-item';
import { CartViewed } from './_components/cart-viewed';
import { getCart } from './page-data';
import { headers } from 'next/headers';

// The cart reflects customer-specific data and should never be cached.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Cart');

  return {
    title: t('title'),
  };
}

export default async function Cart() {
  const t = await getTranslations('Cart');
  const format = await getFormatter();

  const headersList = headers() as unknown as Headers;
  const referer = headersList.get('referer');
  const url = referer ? new URL(referer) : new URL('http://localhost');
  const cartIdFromUrl = url.searchParams.get('id');

  const cartId = cartIdFromUrl || await getCartId();

  if (!cartId) {
    return (
      <CartEmptyState
        cta={{ label: t('Empty.cta'), href: '/shop-all' }}
        subtitle={t('Empty.subtitle')}
        title={t('Empty.title')}
      />
    );
  }

  const data = await getCart({ cartId });

  const cart = data.site.cart;
  const checkout = data.site.checkout;

  if (!cart) {
    return (
      <CartEmptyState
        cta={{ label: t('Empty.cta'), href: '/shop-all' }}
        subtitle={t('Empty.subtitle')}
        title={t('Empty.title')}
      />
    );
  }

  const lineItems = [...cart.lineItems.physicalItems, ...cart.lineItems.digitalItems];
  console.log('LINE ITEMS', lineItems);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const formattedLineItems = lineItems.map((item) => ({
    id: item.entityId,
    quantity: item.quantity,
    price: format.number(item.listPrice.value, {
      style: 'currency',
      currency: item.listPrice.currencyCode,
    }),
    subtitle: item.selectedOptions
      .map((option) => {
        switch (option.__typename) {
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
    <>
      <CartComponent
        cart={{
          lineItems: formattedLineItems,
          total: format.number(checkout?.grandTotal?.value || 0, {
            style: 'currency',
            currency: cart.currencyCode,
          }),
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
        checkoutAction={redirectToCheckout}
        checkoutLabel={t('proceedToCheckout')}
        decrementLineItemLabel={t('decrement')}
        deleteLineItemLabel={t('removeItem')}
        emptyState={{
          title: t('Empty.title'),
          subtitle: t('Empty.subtitle'),
          cta: { label: t('Empty.cta'), href: '/shop-all' },
        }}
        incrementLineItemLabel={t('increment')}
        key={`${cart.entityId}-${cart.version}`}
        lineItemAction={updateLineItem}
        summaryTitle={t('CheckoutSummary.title')}
        title={t('title')}
      />
      <CartViewed
        currencyCode={cart.currencyCode}
        lineItems={lineItems}
        subtotal={checkout?.subtotal?.value}
      />
    </>
  );
}
