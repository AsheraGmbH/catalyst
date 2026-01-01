'use client';

import { PropsWithChildren, useEffect } from 'react';

import { Toaster } from '@/vibes/soul/primitives/toaster';
import { SearchProvider } from '~/lib/search';
import { IubendaProvider, IubendaCookieSolutionBannerConfigInterface } from '@mep-agency/next-iubenda';
import { bodl } from '~/lib/bodl';

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
    <SearchProvider>
      <Toaster position="top-right" />
      <IubendaProvider bannerConfig={iubendaBannerConfig}>
        <div />
      </IubendaProvider>
      {children}
    </SearchProvider>
  );
}
