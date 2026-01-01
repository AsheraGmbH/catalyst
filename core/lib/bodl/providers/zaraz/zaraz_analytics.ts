import { isIubendaConsentGiven } from '~/lib/consent-manager/iubenda-utils';

declare global {
  interface Window {
    zaraz?: {
      track: (event: string, payload: any) => void;
      ecommerce: (event: string, payload: any) => void;
      set: (key: string, value: any, options?: any) => void;
    };
    bodlEvents?: {
      checkout?: {
        checkoutBegin?: (callback: (payload: any) => void) => any;
        orderPurchased?: (callback: (payload: any) => void) => any;
        shippingDetailsProvided?: (callback: (payload: any) => void) => any;
        paymentDetailsProvided?: (callback: (payload: any) => void) => any;
        emit?: (event: string, payload: any) => void;
      };
      cart?: {
        viewed?: (callback: (payload: any) => void) => any;
        addItem?: (callback: (payload: any) => void) => any;
        removeItem?: (callback: (payload: any) => void) => any;
        emit?: (event: string, payload: any) => void;
      };
      product?: {
        pageViewed?: (callback: (payload: any) => void) => any;
        categoryViewed?: (callback: (payload: any) => void) => any;
        searchPerformed?: (callback: (payload: any) => void) => any;
        emit?: (event: string, payload: any) => void;
      };
      banner?: {
        viewed?: (callback: (payload: any) => void) => any;
      };
      consent?: {
        loaded?: (callback: (payload: any) => void) => any;
        updated?: (callback: (payload: any) => void) => any;
        emit?: (event: string, payload: any) => void;
      };
    };
  }
}

export function subscribeZarazToDataLayer() {
  let orderPurchasedSent = false;
  let paymentDetailsProvidedSent = false;
  let shippingInfoProvidedSent = false;
  let checkoutBeginSent = false;

  if (!window || typeof window.bodlEvents === 'undefined') {
    return;
  }

  function addDestination(payload: any) {
    return payload;
  }

  async function getUserIP(): Promise<string | null> {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch (err) {
      console.error('Failed to fetch IP address:', err);
      return null;
    }
  }

  function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // if node_env is not production, create a mock function
  if (process.env.NODE_ENV !== 'production') {
    window.zaraz = window.zaraz || {};
    window.zaraz.track = function (event: string, payload: any) {
      console.log('Zaraz Event:', event, payload);
    };
    window.zaraz.ecommerce = function (event: string, payload: any) {
      console.log('Zaraz Ecommerce Event:', event, payload);
    };
    window.zaraz.set = function (key: string, value: any, options?: any) {
      // Mock implementation
    };
  }

  // See docs with appropriate fields for each event here
  // https://developers.google.com/analytics/devguides/collection/ga4/reference/events
  function transformItem(item: any, index: number): any {
    const transformed: any = {
      product_id: item.product_id || item.item_id,
      sku: item.sku || item.variant_sku || item.product_sku,
      name: item.product_name,
      currency: item.currency,
      discount: item.discount,
      position: typeof item.index !== 'undefined' ? item.index + 1 : index + 1,
      brand: item.brand_name,
      variant: item.sku || item.variant_sku || item.product_sku || item.product_id,
      quantity: item.quantity,
    };

    const MAX_CATEGORIES_COUNT = 5;

    if (item.category_name) {
      transformed.item_category = item.category_name;
    } else if (item.category_names && Array.isArray(item.category_names)) {
      const categories = item.category_names.slice(0, MAX_CATEGORIES_COUNT);

      categories.forEach(function (category: string, index: number) {
        const key = 'item_category' + (index ? index + 1 : '');
        transformed[key] = category;
      });
    }

    if (item.purchase_price) {
      transformed.price = +item.purchase_price;
      transformed.value = +item.purchase_price;
    } else {
      transformed.price = item.sale_price > 0 ? +item.sale_price : +item.price;
      transformed.value = item.sale_price > 0 ? +item.sale_price : +item.price;
    }

    if (item.coupon) {
      transformed.coupon = item.coupon;
    }

    return transformed;
  }

  function subscribeOnCheckoutEvents() {
    const GA_TO_BODL_CHECKOUT_EVENTS = {
      begin_checkout: 'begin_checkout',
      purchase: 'purchase',
      add_shipping_info: 'add_shipping_info',
      add_payment_info: 'add_payment_info',
    };

    function transformCommonCheckoutPayload(payload: any): any {
      const coupon =
        Array.isArray(payload.coupon_codes) && payload.coupon_codes.length
          ? payload.coupon_codes[0]
          : payload.coupon;

      const transformed: any = {
        currency: payload.currency,
        value: payload.cart_value || payload.checkout_value,
        items: payload.line_items.map(function (item: any, index: number) {
          if (coupon) {
            item.coupon = coupon;
          }
          return transformItem(item, index);
        }),
      };

      if (coupon) {
        transformed.coupon = coupon;
      }

      return addDestination(transformed);
    }

    function transformPurchasePayload(payload: any): any {
      const commonPayload = transformCommonCheckoutPayload(payload);

      const purchasePayload: any = {
        transaction_id: payload.order_id || payload.transaction_id,
        shipping: payload.shipping_cost,
      };

      if (payload.tax || payload.tax_value) {
        purchasePayload.tax = payload.tax || payload.tax_value;
      }

      return addDestination(Object.assign(commonPayload, purchasePayload));
    }

    function transformBeginCheckoutPayload(payload: any): any {
      return addDestination(transformCommonCheckoutPayload(payload));
    }

    function transformShippingDetailsProvidedPayload(payload: any): any {
      const commonPayload = transformCommonCheckoutPayload(payload);
      const shippingDetailsProvidedPayload: any = {
        shipping_tier: payload.shipping_method,
      };

      return addDestination(Object.assign(commonPayload, shippingDetailsProvidedPayload));
    }

    function transformPaymentDetailsProvidedPayload(payload: any): any {
      const commonPayload = transformCommonCheckoutPayload(payload);
      const paymentDetailsProvidedPayload: any = {
        payment_type: payload.payment_type,
      };

      return addDestination(Object.assign(commonPayload, paymentDetailsProvidedPayload));
    }

    if (typeof window.bodlEvents.checkout === 'undefined') {
      return;
    }

    if (typeof window.bodlEvents.checkout.checkoutBegin === 'function') {
      window.bodlEvents.checkout.checkoutBegin(async (payload: any) => {
        if (!isIubendaConsentGiven()) return;
        
        console.log("Checkout Begin Event Triggered");

        if (checkoutBeginSent) return;
        checkoutBeginSent = true;
        const cart = transformPurchasePayload(payload);
        
        if (window.zaraz?.ecommerce) {
          window.zaraz.ecommerce("Checkout Started", {
            checkout_id: payload.checkout_id,
            products: cart.items,
            currency: cart.currency,
            value: payload.checkout_value,
          });
        }
      });
    }
    
    if (typeof window.bodlEvents.checkout.orderPurchased === 'function') {
      window.bodlEvents.checkout.orderPurchased(async (payload: any) => {
        if (!isIubendaConsentGiven()) return;
        
        console.log("Order Purchased Event Triggered");

        if (orderPurchasedSent) return;
        orderPurchasedSent = true;
        const cookieName = "order_" + payload.order_id;
        if (document.cookie.includes(cookieName)) return;
        
        try {
          const cart = transformPurchasePayload(payload);

          if (window.zaraz?.ecommerce) {
            window.zaraz.ecommerce("Order Completed", {
              products: cart.items,
              order_id: payload.order_id,
              checkout_id: payload.checkout_id,
              total: payload.checkout_value,
              revenue: payload.checkout_value,
              currency: cart.currency,
              shipping: payload.shipping_cost,
              tax: cart.tax || 0,
              coupon: payload.coupon_codes?.[0] || null
            });
          }

          document.cookie = `${cookieName}=1; path=/; max-age=63072000; SameSite=Lax; Secure`;
        } catch (err) {
          console.error("Order fetch failed", err);
        }
      });
    }
    
    if (typeof window.bodlEvents.checkout.shippingDetailsProvided === 'function') {
      window.bodlEvents.checkout.shippingDetailsProvided(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_CHECKOUT_EVENTS.add_shipping_info, transformShippingDetailsProvidedPayload(payload));
        }
      });
    }
    
    if (typeof window.bodlEvents.checkout.paymentDetailsProvided === 'function') {
      window.bodlEvents.checkout.paymentDetailsProvided(async (payload: any) => {
        if (!isIubendaConsentGiven()) return;
        
        if (paymentDetailsProvidedSent) return;
        paymentDetailsProvidedSent = true;
        const cart = transformPurchasePayload(payload);
        
        if (window.zaraz?.ecommerce) {
          window.zaraz.ecommerce("Payment Info Added", { products: cart.items, payment_type: payload.payment_type });
        }
      });
    }
  }

  function subscribeOnCartEvents() {
    if (typeof window.bodlEvents.cart === 'undefined') {
      return;
    }

    const GA_TO_BODL_CART_EVENTS = {
      view: 'view_cart',
      add: 'add_to_cart',
      remove: 'remove_from_cart',
    };

    function transformCartEventPayload(payload: any): any {
      const item = payload.line_items?.[0];

      if (!item) return null;

      return {
        product_id: item.item_id || "",
        sku: item.sku || "",
        category: item.category_name || "Uncategorized",
        name: item.product_name || "",
        brand: item.brand_name || "",
        variant: "Default", // or get from somewhere if available
        price: parseFloat(item.purchase_price) || 0,
        currency: item.currency?.toLowerCase() || payload.currency?.toLowerCase() || "usd",
        quantity: item.quantity || 1,
        coupon: item.discount || "",
        value: (parseFloat(item.purchase_price) || 0) * (item.quantity || 1),
        position: 1,
      };
    }

    if (typeof window.bodlEvents.cart.viewed === 'function') {
      window.bodlEvents.cart.viewed(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.ecommerce) {
          window.zaraz.ecommerce("Product Viewed", transformCartEventPayload(payload));
        }
      });
    }
    
    if (typeof window.bodlEvents.cart.addItem === 'function') {
      window.bodlEvents.cart.addItem(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.ecommerce) {
          window.zaraz.ecommerce("Product Added", transformCartEventPayload(payload));
        }
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_CART_EVENTS.add, transformCartEventPayload(payload));
        }
      });
    }
    
    if (typeof window.bodlEvents.cart.removeItem === 'function') {
      window.bodlEvents.cart.removeItem(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_CART_EVENTS.remove, transformCartEventPayload(payload));
        }
      });
    }
  }

  function subscribeOnProductEvents() {
    if (typeof window.bodlEvents.product === 'undefined') {
      return;
    }

    const GA_TO_BODL_PRODUCT_EVENTS = {
      product_viewed: 'view_item',
      category_viewed: 'view_item_list',
      search: 'search',
    };

    function transformProductViewedPayload(payload: any): any {
      const item = payload.line_items?.[0];

      if (!item) return null;

      return {
        product_id: item.item_id || "",
        sku: item.sku || "",
        category: item.category_name || "Uncategorized",
        name: item.product_name || "",
        brand: item.brand_name || "",
        variant: "Default", // or get from somewhere if available
        price: parseFloat(item.purchase_price) || 0,
        currency: item.currency?.toLowerCase() || payload.currency?.toLowerCase() || "usd",
        quantity: item.quantity || 1,
        coupon: item.discount || "",
        value: (parseFloat(item.purchase_price) || 0) * (item.quantity || 1),
        position: 1,
      };
    }

    function transformCategoryViewedPayload(payload: any): any {
      return addDestination({
        item_list_id: payload.category_id,
        item_list_name: payload.category_name,
        items: payload.line_items && payload.line_items.map(transformItem),
      });
    }

    function transformSearchPerformedPayload(payload: any): any {
      return addDestination({
        search_term: payload.search_keyword,
      });
    }

    if (typeof window.bodlEvents.product.pageViewed === 'function') {
      window.bodlEvents.product.pageViewed(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.ecommerce) {
          window.zaraz.ecommerce("Product Viewed", transformProductViewedPayload(payload));
        }
      });
    }
    
    if (typeof window.bodlEvents.product.categoryViewed === 'function') {
      window.bodlEvents.product.categoryViewed(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_PRODUCT_EVENTS.category_viewed, transformCategoryViewedPayload(payload));
        }
      });
    }
    
    if (typeof window.bodlEvents.product.searchPerformed === 'function') {
      window.bodlEvents.product.searchPerformed(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_PRODUCT_EVENTS.search, transformSearchPerformedPayload(payload));
        }
      });
    }
  }

  function subscribeOnPromotionEvents() {
    if (typeof window.bodlEvents.banner === 'undefined') {
      return;
    }

    const GA_TO_BODL_PROMOTION_EVENTS = {
      view: 'view_promotion',
    };

    function transformPromotionViewedPayload(payload: any): any {
      return addDestination({
        promotion_id: 'banner_' + payload.banner_id,
        promotion_name: payload.banner_name,
      });
    }

    if (typeof window.bodlEvents.banner.viewed === 'function') {
      window.bodlEvents.banner.viewed(function (payload: any) {
        if (!isIubendaConsentGiven()) return;
        
        if (window.zaraz?.track) {
          window.zaraz.track(GA_TO_BODL_PROMOTION_EVENTS.view, transformPromotionViewedPayload(payload));
        }
      });
    }
  }

  function setFacebookUserData(ip: string | null) {
    if (!isIubendaConsentGiven()) return;
    
    const user_data: any = {};
    const fbc = getCookie('_fbc');
    const fbp = getCookie('_fbp');
    const _gcl_au = getCookie('_gcl_au');
    const _gcl_aw = getCookie('_gcl_aw');
    const _ga = getCookie('_ga');
    const epik = getCookie("_epik") || getCookie("_derived_epik");
    const externalId = getCookie("external_id");

    if (ip) {
      user_data.client_ip_address = ip;
      user_data.client_user_agent = navigator.userAgent;
    }

    // if cookie _epik exists, add it to user_data as click_id
    if (epik) {
      user_data.click_id = epik;
    }

    if (externalId) {
      user_data.external_id = externalId;
    }

    if (fbc) user_data.fbc = fbc;
    if (fbp) user_data.fbp = fbp;
    if (_gcl_au) user_data.gcl_au = _gcl_au;
    if (_gcl_aw) user_data.gcl_aw = _gcl_aw;
    if (_ga) user_data.ga_id = _ga;

    // zaraz.set('user_data', user_data, { scope: 'persist' });
  }

  async function subscribeOnEcommerceEvents() {
    const ip = await getUserIP();
    setFacebookUserData(ip);

    subscribeOnCheckoutEvents();
    subscribeOnCartEvents();
    subscribeOnProductEvents();
    subscribeOnPromotionEvents();
  }

  (async function () {
    await subscribeOnEcommerceEvents();
  })();
}

