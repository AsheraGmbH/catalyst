declare namespace Analytics {
  namespace Navigation {
    interface Product {
      product_id: string;
      product_name: string;
      brand_name?: string;
      sku?: string;
      sale_price?: number;
      purchase_price: number;
      base_price?: number;
      retail_price?: number;
      currency: string;
      category_names?: string[];
      variant_id?: number[];
      quantity?: number;
    }

    interface ProductViewedPayload {
      currency: string;
      product_value: number;
      line_items: Product[];
    }

    interface CategoryViewedPayload {
      category_id: number;
      category_name: string;
      line_items: Product[];
    }

    export interface Events {
      categoryViewed: (payload: CategoryViewedPayload) => void;
      productViewed: (payload: ProductViewedPayload) => void;
    }
  }

  export namespace Cart {
    interface Product {
      product_id: string;
      product_name: string;
      brand_name?: string;
      sku?: string;
      sale_price?: number;
      purchase_price: number;
      base_price?: number;
      retail_price?: number;
      currency: string;
      category_names?: string[];
      variant_id?: number[];
      quantity?: number;
    }

    interface ProductAddedPayload {
      currency: string;
      product_value: number;
      line_items: Product[];
    }

    interface CartViewedPayload {
      currency: string;
      cart_value: number;
      line_items: Product[];
    }

    interface ProductRemovedPayload {
      currency: string;
      product_value: number;
      line_items: Product[];
    }

    export interface Events {
      cartViewed: (payload: CartViewedPayload) => void;
      productAdded: (payload: ProductAddedPayload) => void;
      productRemoved: (payload: ProductRemovedPayload) => void;
    }
  }

  export namespace Checkout {
    interface CheckoutBeginPayload {
      currency: string;
      checkout_value: number;
      line_items: Product[];
      checkout_id: string;
    }

    interface ProductPurchasedPayload {
      currency: string;
      checkout_value: number;
      line_items: Product[];
      checkout_id: string;
      order_id: string;
      tax_value: number;
      discount_value: number;
      shipping_cost: number;
    }

    interface ShippingInfoUpdatedPayload {
      currency: string;
      checkout_value: number;
      line_items: Product[];
      checkout_id: string;
    }

    interface PaymentMethodUpdatedPayload {
      currency: string;
      checkout_value: number;
      line_items: Product[];
      checkout_id: string;
      payment_type: string;
    }

    export interface Events {
      checkoutBegin: (payload: CheckoutBeginPayload) => void;
      productPurchased: (payload: ProductPurchasedPayload) => void;
      shippingInfoUpdated: (payload: ShippingInfoUpdatedPayload) => void;
      paymentMethodUpdated: (payload: PaymentMethodUpdatedPayload) => void;
    }
  }

  export namespace Consent {
    interface ConsentLoadedPayload {
      functional: boolean;
      analytics: boolean;
      advertising: boolean;
    }

    interface ConsentUpdatedPayload {
      functional: boolean;
      analytics: boolean;
      advertising: boolean;
    }

    export interface Events {
      consentLoaded: (payload: ConsentLoadedPayload) => void;
      consentUpdated: (payload: ConsentUpdatedPayload) => void;
    }
  }
}
