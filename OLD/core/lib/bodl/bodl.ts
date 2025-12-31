import type BodlEvents from '@bigcommerce/bodl-events';
import { v4 as uuidv4 } from 'uuid';

import { subscribeOnBodlEvents } from './providers/ga4/google_analytics4';
import { subscribeZarazToDataLayer } from './providers/zaraz/zaraz_analytics'

declare global {
  interface Window {
    bodlEvents?: typeof BodlEvents;
  }
}

interface BodlGoogleAnalyticsConfig {
  id?: string;
  consentModeEnabled?: boolean;
  developerId?: string;
}

interface BodlConfig {
  channelId: number;
  googleAnalytics: BodlGoogleAnalyticsConfig;
  googleTagManager: BodlGoogleAnalyticsConfig;
}

export class Bodl {
  static #instance: Bodl | null = null;

  readonly cart = this.getCartEvents();
  readonly navigation = this.getNavigationEvents();
  readonly checkout = this.getCheckoutEvents();
  readonly consent = this.getConsentEvents();

  private readonly bodlScriptId = 'bodl-events-script';
  private readonly dataLayerScriptId = 'data-layer-script';
  private readonly gtagScriptId = 'gtag-script';
  private isInitalized = false;

  constructor(private config: BodlConfig) {
    if (Bodl.#instance) {
      return Bodl.#instance;
    }

    Bodl.#instance = this;
  }

  static waitForBodlEvents(callback: () => void, iteration = 0) {
    if (window.bodlEvents) {
      callback();

      return;
    }

    if (iteration >= 10) {
      return;
    }

    setTimeout(() => {
      this.waitForBodlEvents(callback, iteration + 1);
    }, 1000);
  }

  initialize() {
    try {
      this.assertsValidConfig(this.config);

      if(this.isInitalized) {
        return;
      }

      if (typeof window === 'undefined') {
        throw new Error('Bodl is only available in the browser environment');
      }

      this.initializeBodlEvents();
      // this.initializeDataLayer();
      // his.initializeGTM();
      this.initializeConsentMode();

      this.bindEvents();

      Bodl.waitForBodlEvents(() => {
        // subscribeOnBodlEvents(
        //   this.config.googleAnalytics.id,
        //   this.config.googleAnalytics.consentModeEnabled,
        // );
        subscribeZarazToDataLayer()
      });

      // set isInitalized to true
      this.isInitalized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error);
    }
  }

  private assertsValidConfig(config?: BodlConfig): asserts config is BodlConfig {
    if (!this.config.channelId) {
      throw new Error('Bodl requires a channel ID');
    }

    if (!this.config.googleAnalytics.id) {
      throw new Error('Bodl requires a Google Analytics ID');
    }
  }

  private initializeBodlEvents() {
    const existingScript = document.getElementById(this.bodlScriptId);

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');

    script.id = this.bodlScriptId;
    script.type = 'text/javascript';
    script.src = 'https://microapps.bigcommerce.com/bodl-events/index.js';

    document.body.appendChild(script);
  }

  private initializeDataLayer() {
    const existingScript = document.getElementById(this.dataLayerScriptId);

    if (existingScript) {
      return;
    }

    //
    // Google Tag Manager
    //
    
    const script = document.createElement('script');

    script.id = this.dataLayerScriptId;
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'}); var f=d.getElementsByTagName(s)[0], j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:''; j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id=${this.config.googleTagManager.id}'+dl; f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','${this.config.googleTagManager.id}');
    `;

    document.head.appendChild(script);

    // append noscript tag
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');

    iframe.src = `https://www.googletagmanager.com/ns.html?id=${this.config.googleTagManager.id}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';

    noscript.appendChild(iframe);
    document.body.appendChild(noscript);

    // 
    // Google Analytics 4
    //

    const scriptGtag = document.createElement('script');

    scriptGtag.id = this.dataLayerScriptId;
    scriptGtag.type = 'text/javascript';
    scriptGtag.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('set', 'developer_id.${this.config.googleAnalytics.developerId}', true);
      gtag('config', '${this.config.googleAnalytics.id}');
    `;

    document.body.appendChild(scriptGtag);
  }

  private initializeGTM() {
    const existingScript = document.getElementById(this.gtagScriptId);

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');

    script.id = this.gtagScriptId;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalytics.id}`;
    script.async = true;

    document.head.appendChild(script);
  }

  private initializeConsentMode() {
    if (!this.config.googleAnalytics.consentModeEnabled) {
      return;
    }

    gtag('consent', 'default', {
      ad_personalization: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
    });
  }

  private bindEvents() {
    this.bindConsentEvents();
  }

  private getCheckoutEvents() {
    return {
      checkoutBegin: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout.emit('bodl_v1_begin_checkout', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      productPurchased: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout.emit('bodl_v1_order_purchased', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      shippingInfoUpdated: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout.emit('bodl_v1_shipping_information_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      paymentMethodUpdated: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout.emit('bodl_v1_payment_information_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    } satisfies Analytics.Checkout.Events;
  }

  private getCartEvents() {
    return {
      productAdded: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart.emit('bodl_v1_cart_product_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      productRemoved: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart.emit('bodl_v1_cart_product_removed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      cartViewed: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart.emit('bodl_v1_cart_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    } satisfies Analytics.Cart.Events;
  }

  private getNavigationEvents() {
    return {
      productViewed: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.product.emit('bodl_v1_product_page_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      categoryViewed: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.product.emit('bodl_v1_product_category_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    } satisfies Analytics.Navigation.Events;
  }

  private getConsentEvents() {
    return {
      consentLoaded: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.consent.emit('bodl_v1_consent_loaded', {
            event_id: uuidv4(),
            ...payload,
          });
        });
      },
      consentUpdated: (payload) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.consent.emit('bodl_v1_consent_updated', {
            event_id: uuidv4(),
            ...payload,
          });
        });
      },
    } satisfies Analytics.Consent.Events;
  }

  private bindConsentEvents() {
    Bodl.waitForBodlEvents(() => {
      window.bodlEvents?.consent.loaded((payload) => {
        gtag('consent', 'update', {
          ad_personalization: payload.advertising ? 'granted' : 'denied',
          ad_storage: payload.advertising ? 'granted' : 'denied',
          ad_user_data: payload.advertising ? 'granted' : 'denied',
          analytics_storage: payload.analytics ? 'granted' : 'denied',
          functionality_storage: payload.functional ? 'granted' : 'denied',
        });
      });

      window.bodlEvents?.consent.updated((payload) => {
        gtag('consent', 'update', {
          ad_personalization: payload.advertising ? 'granted' : 'denied',
          ad_storage: payload.advertising ? 'granted' : 'denied',
          ad_user_data: payload.advertising ? 'granted' : 'denied',
          analytics_storage: payload.analytics ? 'granted' : 'denied',
          functionality_storage: payload.functional ? 'granted' : 'denied',
        });
      });
    });
  }
}
