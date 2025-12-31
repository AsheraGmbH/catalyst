'use client';

import dynamic from 'next/dynamic';
import { PropsWithChildren, useEffect } from 'react';

import type { Toaster as ToasterComponent } from '@/vibes/soul/primitives/toaster';
import { CartProvider } from '~/components/header/cart-provider';
import { CompareDrawerProvider } from '~/components/ui/compare-drawer';
import { IubendaProvider, IubendaCookieSolutionBannerConfigInterface } from '@mep-agency/next-iubenda';
import { bodl } from '~/lib/bodl';

const LazyToaster = dynamic(
  () =>
    import('@/vibes/soul/primitives/toaster').then((mod) => ({
      default: mod.Toaster,
    })),
  { ssr: false },
) as unknown as ToasterComponent;

const iubendaBannerConfig: IubendaCookieSolutionBannerConfigInterface = {
  "askConsentAtCookiePolicyUpdate": true,
  "countryDetection": true,
  // @ts-ignore
  "enableFadp": true,
  "enableLgpd": true,
  "enableUspr": true,
  "lang": "en",
  "lgpdAppliesGlobally": false,
  "rebuildIframe": false,
  "siteId": 2308993,
  "cookiePolicyId": 43241044,
  "i18n": {
    "en": {
      "banner": {
        "title": "Cookie and Privacy Notice"
      }
    }
  },
  "banner": {
    "acceptButtonCaptionColor": "#000000",
    "acceptButtonColor": "#FFFFFF",
    "acceptButtonDisplay": true,
    "backgroundColor": "#2B2D2F",
    "brandBackgroundColor": "#2B2D2F",
    "closeButtonRejects": true,
    "customizeButtonDisplay": true,
    "explicitWithdrawal": true,
    "fontSizeBody": "12px",
    "fontSizeCloseButton": "24px",
    "listPurposes": true,
    "logo": "/iubenda-logo.svg",
    // @ts-ignore
    "ownerName": "Ashera GmbH",
    "position": "float-bottom-center",
    "rejectButtonCaptionColor": "#000000",
    "rejectButtonColor": "#FFFFFF",
    "rejectButtonDisplay": true
  }
};

export function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    bodl.initialize();
  }, []);

  return (
    <>
      <LazyToaster position="top-right" />
      <CartProvider>
        <IubendaProvider bannerConfig={iubendaBannerConfig}>
          <div />
        </IubendaProvider>
        <CompareDrawerProvider>{children}</CompareDrawerProvider>
      </CartProvider>
    </>
  );
}
