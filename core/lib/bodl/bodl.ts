import { v4 as uuidv4 } from 'uuid';

import { subscribeZarazToDataLayer } from './providers/zaraz/zaraz_analytics';

declare global {
  interface Window {
    bodlEvents?: {
      checkout?: {
        emit: (event: string, payload: any) => void;
      };
      cart?: {
        emit: (event: string, payload: any) => void;
      };
      product?: {
        emit: (event: string, payload: any) => void;
      };
      consent?: {
        emit: (event: string, payload: any) => void;
        loaded?: (callback: (payload: any) => void) => void;
        updated?: (callback: (payload: any) => void) => void;
      };
    };
    gtag?: (...args: any[]) => void;
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

      if (this.isInitalized) {
        return;
      }

      if (typeof window === 'undefined') {
        throw new Error('Bodl is only available in the browser environment');
      }

      this.initializeBodlEvents();
      // Note: DataLayer and GTM initialization commented out in OLD
      // this.initializeDataLayer();
      // this.initializeGTM();
      this.initializeConsentMode();

      this.bindEvents();

      Bodl.waitForBodlEvents(() => {
        // Note: GA4 subscription commented out in OLD
        // subscribeOnBodlEvents(
        //   this.config.googleAnalytics.id,
        //   this.config.googleAnalytics.consentModeEnabled,
        // );
        subscribeZarazToDataLayer();
      });

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

  private initializeConsentMode() {
    if (!this.config.googleAnalytics.consentModeEnabled || !window.gtag) {
      return;
    }

    window.gtag('consent', 'default', {
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
      checkoutBegin: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout?.emit('bodl_v1_begin_checkout', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      productPurchased: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout?.emit('bodl_v1_order_purchased', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      shippingInfoUpdated: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout?.emit('bodl_v1_shipping_information_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      paymentMethodUpdated: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.checkout?.emit('bodl_v1_payment_information_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    };
  }

  private getCartEvents() {
    return {
      productAdded: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart?.emit('bodl_v1_cart_product_added', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      productRemoved: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart?.emit('bodl_v1_cart_product_removed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      cartViewed: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.cart?.emit('bodl_v1_cart_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    };
  }

  private getNavigationEvents() {
    return {
      productViewed: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.product?.emit('bodl_v1_product_page_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
      categoryViewed: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.product?.emit('bodl_v1_product_category_viewed', {
            event_id: uuidv4(),
            channel_id: this.config.channelId,
            ...payload,
          });
        });
      },
    };
  }

  private getConsentEvents() {
    return {
      consentLoaded: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.consent?.emit('bodl_v1_consent_loaded', {
            event_id: uuidv4(),
            ...payload,
          });
        });
      },
      consentUpdated: (payload: any) => {
        Bodl.waitForBodlEvents(() => {
          window.bodlEvents?.consent?.emit('bodl_v1_consent_updated', {
            event_id: uuidv4(),
            ...payload,
          });
        });
      },
    };
  }

  private bindConsentEvents() {
    Bodl.waitForBodlEvents(() => {
      if (window.bodlEvents?.consent?.loaded && window.gtag) {
        window.bodlEvents.consent.loaded((payload: any) => {
          window.gtag('consent', 'update', {
            ad_personalization: payload.advertising ? 'granted' : 'denied',
            ad_storage: payload.advertising ? 'granted' : 'denied',
            ad_user_data: payload.advertising ? 'granted' : 'denied',
            analytics_storage: payload.analytics ? 'granted' : 'denied',
            functionality_storage: payload.functional ? 'granted' : 'denied',
          });
        });
      }

      if (window.bodlEvents?.consent?.updated && window.gtag) {
        window.bodlEvents.consent.updated((payload: any) => {
          window.gtag('consent', 'update', {
            ad_personalization: payload.advertising ? 'granted' : 'denied',
            ad_storage: payload.advertising ? 'granted' : 'denied',
            ad_user_data: payload.advertising ? 'granted' : 'denied',
            analytics_storage: payload.analytics ? 'granted' : 'denied',
            functionality_storage: payload.functional ? 'granted' : 'denied',
          });
        });
      }
    });
  }
}
