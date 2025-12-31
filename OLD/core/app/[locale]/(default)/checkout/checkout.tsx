'use client';

import React, {
  useState,
  useEffect,
  useActionState,
  useRef,
  useTransition,
  useMemo,
  useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import { SubmissionResult } from '@conform-to/react';
import {
  PayPalButtons,
  PayPalButtonsComponentProps,
  PayPalScriptProvider,
} from '@paypal/react-paypal-js';
import { Input } from '@/vibes/soul/form/floatable-input';
import { Select } from '@/vibes/soul/form/select';
import { countries } from './data';
const CartAccordion = dynamic(() => import('./_components/CartAccordion'), { ssr: false });
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const paypalEnvironment: any = process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT!;
// ⬇️ Load Maps widgets only when needed (code-split)
const LoadScript = dynamic(
  () => import('@react-google-maps/api').then((m) => m.LoadScript),
  { ssr: false },
);
const Autocomplete = dynamic(
  () => import('@react-google-maps/api').then((m) => m.Autocomplete),
  { ssr: false },
);
import './autocomplete.css';
import { buildAddToCartPayload } from '@/vibes/soul/sections/product-detail/helper';
import { bodl } from '~/lib/bodl';
import { BACKGROUND_IMAGE } from '~/lib/utils';

// Extend global Window interface for Braintree and Apple Pay
declare global {
  interface Window {
    braintree: {
      client: {
        create: (options: { authorization: string }) => Promise<any>;
      };
      applePay: {
        create: (options: { client: any }) => Promise<any>;
      };
      paypalCheckout: {
        create: (options: { client: any }) => Promise<any>;
      };
    };
    ApplePaySession: {
      new (version: number, paymentRequest: any): any;
      STATUS_SUCCESS: number;
      STATUS_FAILURE: number;
      canMakePayments: () => boolean;
    };
    paypal: any;
  }
}

// TypeScript interfaces
interface ShippingInfo {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
}

// Google Maps libraries to load
const libraries: 'places'[] = ['places'];

// Define interface for validation errors
interface Errors {
  [key: string]: string;
}

const PayPalButton = dynamic(() => Promise.resolve(PayPalButtons), { ssr: false });
type Action<State, Payload> = (state: Awaited<State>, payload: Payload) => State | Promise<State>;

export type ProcessPaymentAction = Action<SubmissionResult | null, FormData>;

interface CheckoutClientProps {
  cart: any;
  cartId: string;
  processPayment: ProcessPaymentAction;
  checkoutLineItems: Array<{ lineItemEntityId: string; quantity: number }>;
  rawData: any;
}

export default function CheckoutClient({
  rawData,
  cart,
  cartId,
  processPayment,
  checkoutLineItems,
}: CheckoutClientProps) {
  const [checkoutBeginTriggered, setCheckoutBeginTriggered] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lastResult, formAction] = useActionState(processPayment, null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  // State for validation errors
  const [errors, setErrors] = useState<any>({});
  // State for checkbox
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [shippingInfoSaved, setShippingInfoSaved] = useState(false);
  // State for PayPal button disabled status
  const [isFormValid, setIsFormValid] = useState(false);
  // Ref to store PayPal actions
  const paypalActions = useRef<{ enable: () => void; disable: () => void } | null>(null);
  const oneClickActions = useRef<{ enable: () => void; disable: () => void } | null>(null);
  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: c.code, label: c.name })),
    [],
  );
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [applePayContext, setApplePayContext] = useState<{
    applepay: any;
    config: any;
  } | null>(null);
  const applePayContainerRef = useRef<HTMLDivElement | null>(null);

  // 💡 Load Google Maps only when the user interacts with the Street field
  const [loadMaps, setLoadMaps] = useState(false);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    setScriptError(false);
  };

  const handleScriptError = () => {
    setScriptError(true);
    setScriptLoaded(false);
  };

  // Reference for Google Maps Autocomplete
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    let cancelled = false;
    const pollIntervals: Array<number> = [];

    const hydrateApplePay = () => {
      if (cancelled) return;

      try {
        if (
          window.ApplePaySession?.canMakePayments?.() &&
          window.ApplePaySession.canMakePayments() &&
          typeof window.paypal?.Applepay === 'function'
        ) {
          const applepay = window.paypal.Applepay();

          applepay
            .config()
            .then((applepayConfig: any) => {
              if (cancelled) return;
              if (applepayConfig?.isEligible) {
                setApplePayAvailable(true);
                setApplePayContext({ applepay, config: applepayConfig });
              } else {
                setApplePayAvailable(false);
                setApplePayContext(null);
              }
            })
            .catch((err: any) => {
              if (!cancelled) {
                console.error('Error while fetching Apple Pay configuration.', err);
              }
            });
        } else if (!cancelled) {
          setApplePayAvailable(false);
          setApplePayContext(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error during Apple Pay initialization.', err);
        }
      }
    };

    const waitForPayPal = () => {
      hydrateApplePay();
      if (typeof window.paypal?.Applepay === 'function') {
        return;
      }

      const poll = window.setInterval(() => {
        if (typeof window.paypal?.Applepay === 'function') {
          window.clearInterval(poll);
          hydrateApplePay();
        }
      }, 200);
      pollIntervals.push(poll);
    };

    if (typeof window.paypal?.Applepay === 'function') {
      hydrateApplePay();
    } else {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="paypal.com/sdk/js"]',
      );

      if (script) {
        const handleLoad = () => {
          hydrateApplePay();
          waitForPayPal();
        };

        script.addEventListener('load', handleLoad);
        waitForPayPal();

        return () => {
          cancelled = true;
          script.removeEventListener('load', handleLoad);
          pollIntervals.forEach((id) => window.clearInterval(id));
        };
      }

      waitForPayPal();
    }

    return () => {
      cancelled = true;
      pollIntervals.forEach((id) => window.clearInterval(id));
    };
  }, [cart, rawData]);

  useEffect(() => {
    if (!applePayContext || !applePayContainerRef.current) return;

    applePayContainerRef.current.innerHTML =
      '<apple-pay-button id="btn-appl" class="w-full" buttonstyle="white" type="pay" locale="en"></apple-pay-button>';

    const button = applePayContainerRef.current.querySelector<HTMLButtonElement>('#btn-appl');
    if (!button) {
      return () => {
        if (applePayContainerRef.current) {
          applePayContainerRef.current.innerHTML = '';
        }
      };
    }

    const handleClick = () =>
      startApplePaySession(applePayContext.applepay, applePayContext.config, cart, rawData);

    button.addEventListener('click', handleClick);

    return () => {
      button.removeEventListener('click', handleClick);
      if (applePayContainerRef.current) {
        applePayContainerRef.current.innerHTML = '';
      }
    };
  }, [applePayContext, cart, rawData]);

  // Put this function outside of useEffect
  async function startApplePaySession(
    applepay: any,
    applepayConfig: any,
    cart: any,
    rawData: any,
  ) {
    const paymentRequest = {
      countryCode: applepayConfig.countryCode,
      merchantCapabilities: applepayConfig.merchantCapabilities,
      supportedNetworks: applepayConfig.supportedNetworks,
      currencyCode: cart.currency,
      requiredShippingContactFields: ['name', 'email', 'postalAddress'],
      requiredBillingContactFields: ['postalAddress'],
      total: {
        label: 'Ashera GmBH',
        type: 'final',
        amount: rawData.site.checkout.grandTotal.value.toString(),
      },
      lineItems: [
        {
          label: 'Subtotal',
          type: 'final',
          amount: (
            rawData.site.checkout.grandTotal.value -
            (rawData.site.checkout.taxTotal?.value || 0)
          ).toString(),
        },
        { label: 'Free Shipping', type: 'final', amount: '0' },
        {
          label: 'Tax',
          type: 'final',
          amount: (rawData.site.checkout.taxTotal?.value || 0).toString(),
        },
      ],
    };

    // @ts-ignore
    const session = new ApplePaySession(4, paymentRequest);

    session.onvalidatemerchant = (event: any) => {
      applepay
        .validateMerchant({
          validationUrl: event.validationURL,
          displayName: 'Ashera GmBH',
        })
        .then((validateResult: any) => {
          session.completeMerchantValidation(validateResult.merchantSession);
        })
        .catch((validateError: any) => {
          console.error(validateError);
          session.abort();
        });
    };

    session.onpaymentauthorized = async (event: any) => {
      setPaymentInProgress(true);
      const {
        familyName,
        givenName,
        countryCode,
        administrativeArea,
        emailAddress,
        locality,
        postalCode,
        addressLines,
      } = event.payment.shippingContact;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Your shipping address is:', event.payment.shippingContact);
      }

      const updatedShippingInfo = {
        firstName: givenName || shippingInfo.firstName,
        lastName: familyName || shippingInfo.lastName,
        street: addressLines ? addressLines.join(', ') : shippingInfo.street,
        city: locality || shippingInfo.city,
        state: administrativeArea || shippingInfo.state,
        postalCode: postalCode || shippingInfo.postalCode,
        country: countryCode || shippingInfo.country,
        email: emailAddress || shippingInfo.email,
      };

      // Save shipping address same way as before
      await saveShippingAddress(false, updatedShippingInfo);

      fetch('/api/checkout/paypal/createOrder', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, currency: cart.currency }),
      })
        .then((res) => res.json())
        .then((createOrderData) => {
          const orderId = createOrderData.id;
          applepay
            .confirmOrder({
              orderId,
              token: event.payment.token,
              billingContact: event.payment.billingContact,
            })
            .then(() => {
              // @ts-ignore
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
              fetch(`/api/checkout/paypal/capturePayment`, {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: orderId, cartId }),
              })
                .then((res) => res.json())
                .then((captureResult) => {
                  const { thankYouPageId, orderId } = captureResult.data;
                  setPaymentSuccess(true);

                  // SEND PURCHASE EVENT
                  const transformedPayload = buildAddToCartPayload(rawData.site.cart);
                  if (transformedPayload) {
                    bodl.checkout.productPurchased({
                      ...transformedPayload,
                      checkout_value: rawData.site.checkout.grandTotal.value,
                      checkout_id: cartId,
                      order_id: orderId?.toString(),
                      tax_value: rawData.site.checkout.taxTotal.value,
                      discount_value: rawData.site.checkout.cart.discountedAmount.value,
                      shipping_cost: 0,
                    });
                  }

                  // redirect to thank you page
                  window.location.href = `/thank-you?orderId=${thankYouPageId}`;
                })
                .catch((captureError: any) => console.error(captureError));
            })
            .catch((confirmError: any) => {
              console.error('Error confirming order with applepay token', confirmError);
              // @ts-ignore
              session.completePayment(ApplePaySession.STATUS_FAILURE);
            })
            .finally(() => setPaymentInProgress(false));
        });
    };

    session.begin();
  }

  // Handle input changes
  const handleShippingChange = useCallback((e: any) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the field when user starts typing
    if (value.trim() !== '' && errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name]; // Remove the error entry entirely
        return newErrors;
      });
    }
  }, [errors]);

  // Handle blur event for validation
  const handleBlur = useCallback((e: any) => {
    const { name, value } = e.target;
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev: any) => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
    }
    if (value.trim() === '') {
      setErrors((prev: any) => ({
        ...prev,
        [name]: `${name.charAt(0).toUpperCase() + name.slice(1)} is a required field`,
      }));
    }
  }, []);

  // Handle checkbox change
  const handleAgreementChange = useCallback((e: any) => {
    setAgreementChecked(e.target.checked);
  }, []);

  const handleEditShippingInfo = useCallback(() => {
    setShippingInfoSaved(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (lastResult && !isPending) {
      const status = (lastResult as any).status;
      if (status === 'error') {
        setError('Failed to save shipping address');
      } else if (status === 'success') {
        if (shippingInfo.firstName) {
          setShippingInfoSaved(true);
        }

        if (paypalActions.current) {
          paypalActions.current.enable();
          oneClickActions.current?.disable();
        }
      }
    }
  }, [lastResult, isPending, shippingInfo.firstName]);

  useEffect(() => {
    if (!paymentInProgress && paypalActions.current && shippingInfoSaved && isFormValid) {
      paypalActions.current.enable();
    }
  }, [paymentInProgress, shippingInfoSaved, isFormValid]);

  useEffect(() => {
    if (!paymentInProgress && oneClickActions.current) {
      oneClickActions.current.enable();
    }
  }, [paymentInProgress]);

  // Validate entire form to enable/disable PayPal button
  useEffect(() => {
    const isValid =
      Object.values(shippingInfo).every((value) => value.trim() !== '') &&
      agreementChecked &&
      Object.keys(errors).filter((key) => errors[key] !== '').length === 0;

    setIsFormValid(isValid);
  }, [shippingInfo, agreementChecked, errors]);

  // Memoize PayPal script options
  const paypalOptions = useMemo(
    () => ({
      enableFunding: 'applepay',
      clientId: paypalClientId,
      currency: cart.currency,
      environment: paypalEnvironment,
      intent: 'capture',
      components: 'buttons,funding-eligibility,applepay',
    }),
    [cart.currency, paypalEnvironment],
  );

  // Memoize analytics payload to avoid recomputing on minor renders
  const analyticsPayload = useMemo(
    () => buildAddToCartPayload(rawData.site.cart),
    [rawData.site.cart],
  );

  // PayPal button configuration
  const paypalButtonConfig: PayPalButtonsComponentProps = {
    style: {
      label: 'checkout',
      shape: 'pill',
      disableMaxWidth: true,
    },
    disabled: !shippingInfoSaved,
    onInit: (_data, actions) => {
      // Store actions for dynamic enabling/disabling
      paypalActions.current = actions;
      // Disable button initially
      actions.disable();
    },
    onClick: (_data, actions) => {
      // Validate form before proceeding
      const newErrors: Errors = {};
      Object.keys(shippingInfo).forEach((key) => {
        if ((shippingInfo as any)[key].trim() === '') {
          newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is a required field`;
        }
      });
      setErrors(newErrors);

      if (!agreementChecked && Object.keys(newErrors).length === 0) {
        alert('Please agree to the terms and conditions.');
        return actions.reject(); // Prevent payment flow
      }

      if (Object.keys(newErrors).length > 0) {
        alert('Please fill in all required fields.');
        return actions.reject(); // Prevent payment flow
      }

      if (analyticsPayload) {
        bodl.checkout.paymentMethodUpdated({
          ...analyticsPayload,
          checkout_value: rawData.site.checkout.grandTotal.value,
          checkout_id: cartId,
          payment_type: 'paypal',
        });
      }

      // Allow payment flow if all validations pass
      return actions.resolve();
    },
    onCancel: () => {
      setPaymentInProgress(false);
      setError('PayPal payment was cancelled.');
    },
    onError: (_error) => {
      setPaymentInProgress(false);
      setError('PayPal error. Please try again.');
    },
    createOrder: async () => {
      const res = await fetch('/api/checkout/paypal/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, currency: cart.currency }),
      });
      const orderData = await res.json();
      setPaymentInProgress(true);
      return orderData.id;
    },
    onApprove: async (data: any) => {
      try {
        const res = await fetch('/api/checkout/paypal/capturePayment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: data.orderID, cartId }),
        });
        const captureRes = await res.json();
        const { thankYouPageId, orderId } = captureRes.data;
        setPaymentSuccess(true);

        // SEND PURCHASE EVENT
        if (analyticsPayload) {
          bodl.checkout.productPurchased({
            ...analyticsPayload,
            checkout_value: rawData.site.checkout.grandTotal.value,
            checkout_id: cartId,
            order_id: orderId?.toString(),
            tax_value: rawData.site.checkout.taxTotal.value,
            discount_value: rawData.site.checkout.cart.discountedAmount.value,
            shipping_cost: 0,
          });
        }

        // redirect to thank you page
        window.location.href = `/thank-you?orderId=${thankYouPageId}`;
      } catch (_err) {
        setError('PayPal payment failed. Please try again.');
      }
    },
  };

  const oneClickPaypalButtonConfig: PayPalButtonsComponentProps = {
    style: {
      label: 'buynow',
      shape: 'pill',
      disableMaxWidth: true,
      height: 40,
    },
    disabled: paymentInProgress || shippingInfoSaved,
    onInit: (_data, actions) => {
      oneClickActions.current = actions;
    },
    onCancel: () => {
      setPaymentInProgress(false);
      setError('PayPal payment was cancelled.');
    },
    createOrder: async () => {
      await saveShippingAddress(true); // save shipping address for one-click

      const res = await fetch('/api/checkout/paypal/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartId, currency: cart.currency }),
      });
      const orderData = await res.json();
      setPaymentInProgress(true);
      return orderData.id;
    },
    onError: (_error) => {
      setPaymentInProgress(false);
      setError('PayPal error. Please try again.');
    },
    onApprove: async (data: any) => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('PayPal payment data:', data);
        }
        const res = await fetch('/api/checkout/paypal/capturePayment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: data.orderID, cartId, type: 'oneclick' }),
        });
        const captureRes = await res.json();
        const { thankYouPageId, orderId } = captureRes.data;
        setPaymentSuccess(true);

        // SEND PURCHASE EVENT
        if (analyticsPayload) {
          bodl.checkout.productPurchased({
            ...analyticsPayload,
            checkout_value: rawData.site.checkout.grandTotal.value,
            checkout_id: cartId,
            order_id: orderId?.toString(),
            tax_value: rawData.site.checkout.taxTotal.value,
            discount_value: rawData.site.checkout.cart.discountedAmount.value,
            shipping_cost: 0,
          });
        }

        // redirect to thank you page
        window.location.href = `/thank-you?orderId=${thankYouPageId}`;
      } catch (_err) {
        setError('PayPal payment failed. Please try again.');
      }
    },
  };

  const saveShippingAddress = async (
    oneClick = false,
    shippingInfoOverride: any = null,
  ): Promise<boolean> => {
    setError(null);

    const info = shippingInfoOverride || shippingInfo; // Use override if provided, else fall back to state

    try {
      const formData = new FormData();
      formData.append('cartId', cartId);
      formData.append('shippingFirstName', oneClick ? 'Check' : info.firstName);
      formData.append('shippingLastName', oneClick ? 'PayPal' : info.lastName);
      formData.append('shippingStreet', oneClick ? 'Default Street' : info.street);
      formData.append('shippingCity', oneClick ? 'Default City' : info.city);
      formData.append('shippingPostalCode', oneClick ? 'Default Postal Code' : info.postalCode);
      formData.append('shippingCountry', oneClick ? 'US' : info.country);
      formData.append('shippingState', oneClick ? 'Default State' : info.state);
      formData.append('customerAccessToken', 'YOUR_CUSTOMER_ACCESS_TOKEN');
      formData.append('email', oneClick ? 'default@example.com' : info.email);
      formData.append('checkoutLineItems', JSON.stringify(checkoutLineItems));

      startTransition(async () => {
        await formAction(formData);
      });

      // preserve previous "fire and continue" behavior
      return true;
    } catch (error) {
      console.error('Error saving shipping address:', error);
      return false;
    }
  };

  // Handle Google Maps Autocomplete place selection
  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        setErrors((prev: any) => ({ ...prev, street: 'Please select a valid address' }));
        return;
      }

      // Extract address components
      let street = '';
      let city = '';
      let state = '';
      let postalCode = '';
      let country = '';

      if (process.env.NODE_ENV !== 'production') {
        console.log(place.address_components);
      }
      place.address_components?.forEach((component) => {
        const types = component.types;
        if (types.includes('street_number')) {
          street = component.long_name;
        }
        if (types.includes('route')) {
          street = street ? `${street} ${component.long_name}` : component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_4')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_3')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_2')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (types.includes('country')) {
          country = component.short_name;
        }
      });

      // Map country code to your countryOptions
      const selectedCountry = countryOptions.find((option) => option.value === country);
      if (!selectedCountry) {
        setErrors((prev: any) => ({ ...prev, country: 'Selected country is not supported' }));
        return;
      }

      // Update shipping info
      setShippingInfo((prev) => ({
        ...prev,
        street: street || prev.street,
        city: city || prev.city,
        state: state || prev.state,
        postalCode: postalCode || prev.postalCode,
        country: selectedCountry.value,
      }));

      // Clear errors for updated fields
      setErrors((prev: any) => ({
        ...prev,
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      }));
    }
  };

  // Load Google Maps Autocomplete
  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  // Render the input field, conditionally wrapped with Autocomplete
  const renderAutocompleteInput = () => {
    if (loadMaps) {
      return (
        <LoadScript
          onLoad={handleScriptLoad}
          onError={handleScriptError}
          googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
          libraries={libraries}
        >
          {scriptLoaded && !scriptError ? (
            <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
              <Input
                type="text"
                name="street"
                label="Street Address"
                value={shippingInfo.street}
                onChange={handleShippingChange}
                onBlur={handleBlur}
                placeholder="Start typing your address..."
                required={true}
                errors={errors.street ? [errors.street] : []}
              />
            </Autocomplete>
          ) : (
            <Input
              type="text"
              name="street"
              label="Street Address"
              value={shippingInfo.street}
              onChange={handleShippingChange}
              onBlur={handleBlur}
              placeholder="Start typing your address..."
              required={true}
              errors={errors.street ? [errors.street] : []}
            />
          )}
        </LoadScript>
      );
    }

    // Fallback: Render plain input; load Maps when user focuses
    return (
      <Input
        type="text"
        name="street"
        label="Street Address"
        value={shippingInfo.street}
        onChange={handleShippingChange}
        onBlur={handleBlur}
        onFocus={() => setLoadMaps(true)}
        placeholder="Enter your address..."
        required={true}
        errors={errors.street ? [errors.street] : []}
      />
    );
  };

  useEffect(() => {
    if (!checkoutBeginTriggered) {
      const transformedPayload = analyticsPayload;
      if (transformedPayload) {
        setCheckoutBeginTriggered(true);
        bodl.checkout.checkoutBegin({
          ...transformedPayload,
          checkout_value: rawData.site.checkout.grandTotal.value,
          checkout_id: cartId,
        });
      }
    }
  }, [checkoutBeginTriggered, analyticsPayload, rawData.site.checkout.grandTotal.value, cartId]);

  const cardStyling = `glass px-6 pt-4 pb-8 h-fit rounded-lg`;

  if (!cart) return <div className="text-center">No cart data available</div>;

  return (
    <div
      className="relative"
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      {/* absolute full black background */}
      {(paymentSuccess || paymentInProgress) && (
        <div className="absolute inset-0 bg-black bg-opacity-70 h-full z-20">
          <div className="flex flex-col gap-y-4 items-center justify-center h-full">
            {/* loading spinner */}
            <svg
              className="animate-spin h-10 w-10 text-white mr-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {paymentInProgress && (
              <div className="text-white text-sm md:text-base">
                Processing Payment... Please do not refresh or navigate away.
              </div>
            )}
            {paymentSuccess && (
              <div className="text-white text-sm md:text-base">
                Payment Successful! Redirecting to Thank You page...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Load the PayPal SDK immediately (no defer) so Apple Pay can initialize */}
      <PayPalScriptProvider options={paypalOptions}>
        {/* Maps loads on-demand inside the input; no global Maps wrapper */}
        <div className="z-10 relative container mx-auto px-4 md:px-0 py-2 pb-8 md:py-8 text-white">
          <div className="flex flex-col-reverse gap-y-4 md:flex-row md:gap-x-6">
            {/* Shipping and Payment Form */}
            <div className="w-full md:w-2/3 flex flex-col gap-y-6">
              <div>
                <div className={`${cardStyling}`}>
                  <p className="font-heading text-md md:text-lg mb-4">Check out Faster with:</p>

                  <div className="flex items-center w-full flex-row gap-x-4">
                    <PayPalButtons
                      className="text-sm w-full"
                      {...oneClickPaypalButtonConfig}
                      fundingSource="paypal"
                    />
                    {applePayAvailable && (
                      <div
                        id="applepay-container"
                        ref={applePayContainerRef}
                        className="w-full -mt-[4px]"
                      />
                    )}
                  </div>
                  <div className="text-gray-500 text-[10px] md:text-xs px-2 rounded-md pt-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="inline-block mr-1"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fill="currentColor"
                        d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm-.93-9.588a.5.5 0 0 1 .93 0l.5 1a.5.5 0 0 1-.43.707H7.5a.5.5 0 0 1-.43-.707l.5-1zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                      />
                    </svg>
                    One-Click Checkout uses your PayPal shipping details and skips the form below.
                  </div>
                </div>
                {/* or with 2 lines left and right */}
                <div className="flex items-center mt-2">
                  <div className="flex-grow border-t border-gray-600"></div>
                  <span className="mx-4 text-gray-400">or</span>
                  <div className="flex-grow border-t border-gray-600"></div>
                </div>
              </div>

              <div className={`${cardStyling}`}>
                <div className="flex items-center justify-between mb-6">
                  {/* error div */}
                  <div>
                    {error && (
                      <div className="text-red-500 mb-2 text-xs bg-red-200 px-2 rounded-md py-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="inline-block mr-1"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill="currentColor"
                            d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm-.93-9.588a.5.5 0 0 1 .93 0l.5 1a.5.5 0 0 1-.43.707H7.5a.5.5 0 0 1-.43-.707l.5-1zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                          />
                        </svg>
                        {error}
                      </div>
                    )}
                    <h2 className="text-md md:text-xl font-semibold font-heading">
                      Customer Information
                    </h2>
                  </div>
                  {/* green tick */}
                  {shippingInfoSaved && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      xmlSpace="preserve"
                      width="25"
                      height="25"
                      viewBox="0 0 256 256"
                    >
                      <g fill="#009E04" strokeMiterlimit="10" strokeWidth="0">
                        <path d="m108.046 182.483-39.818-39.818L88.095 122.8l19.951 19.95 59.572-59.571 19.867 19.866z"></path>
                        <path d="M127.857 254.307c-69.725 0-126.45-56.726-126.45-126.45S58.132 1.407 127.857 1.407s126.45 56.725 126.45 126.45-56.726 126.45-126.45 126.45m0-224.8c-54.23 0-98.35 44.12-98.35 98.35s44.12 98.35 98.35 98.35 98.35-44.12 98.35-98.35-44.12-98.35-98.35-98.35"></path>
                      </g>
                    </svg>
                  )}
                </div>
                {shippingInfoSaved ? (
                  <section className="flex flex-col gap-y-2">
                    {/* email */}
                    <div>
                      <span className="font-semibold">Email:</span> {shippingInfo.email}
                    </div>
                    <div>
                      <span className="font-semibold">First Name:</span> {shippingInfo.firstName}
                    </div>
                    <div>
                      <span className="font-semibold">Last Name:</span> {shippingInfo.lastName}
                    </div>
                    <div>
                      <span className="font-semibold">Address:</span> {shippingInfo.street},{' '}
                      {shippingInfo.city}, {shippingInfo.state}, {shippingInfo.postalCode},{' '}
                      {countries.find((c) => c.code === shippingInfo.country)?.name}
                    </div>

                    {/* edit button */}
                    <button
                      onClick={handleEditShippingInfo}
                      className="mt-4 bg-[#2f2f2f] w-fit text-white px-6 py-2 rounded-full hover:bg-[#3f3f3f]"
                    >
                      Edit Shipping Info
                    </button>
                  </section>
                ) : (
                  <section>
                    <div className="space-y-4">
                      <Input
                        errors={errors.email ? [errors.email] : []}
                        key="email"
                        label="Email"
                        name="email"
                        onChange={handleShippingChange}
                        onBlur={handleBlur}
                        required={true}
                        value={shippingInfo.email}
                        placeholder="johndoe@example.com"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          errors={errors.firstName ? [errors.firstName] : []}
                          key="firstName"
                          label="First Name"
                          name="firstName"
                          onChange={handleShippingChange}
                          onBlur={handleBlur}
                          required={true}
                          value={shippingInfo.firstName}
                          placeholder="John"
                        />
                        <Input
                          errors={errors.lastName ? [errors.lastName] : []}
                          key="lastName"
                          label="Last Name"
                          name="lastName"
                          onChange={handleShippingChange}
                          onBlur={handleBlur}
                          required={true}
                          value={shippingInfo.lastName}
                          placeholder="Doe"
                        />
                      </div>
                      {renderAutocompleteInput()}
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="text"
                          name="city"
                          label="City"
                          value={shippingInfo.city}
                          onChange={handleShippingChange}
                          onBlur={handleBlur}
                          placeholder="City"
                          required={true}
                          errors={errors.city ? [errors.city] : []}
                        />
                        <Input
                          type="text"
                          name="state"
                          label="State/Province"
                          value={shippingInfo.state}
                          onChange={handleShippingChange}
                          onBlur={handleBlur}
                          placeholder="State/Province"
                          required={true}
                          errors={errors.state ? [errors.state] : []}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          type="text"
                          name="postalCode"
                          label="Postal Code"
                          value={shippingInfo.postalCode}
                          onChange={handleShippingChange}
                          onBlur={handleBlur}
                          placeholder="Postal Code"
                          required={true}
                          errors={errors.postalCode ? [errors.postalCode] : []}
                        />
                        <Select
                          errors={errors.country ? [errors.country] : []}
                          key="country"
                          hideLabelMobile
                          label="Country"
                          name="country"
                          onBlur={() =>
                            handleBlur({
                              target: { name: 'country', value: shippingInfo.country },
                            })
                          }
                          placeholder="Select a country"
                          onValueChange={(e) =>
                            handleShippingChange({ target: { name: 'country', value: e } })
                          }
                          options={countryOptions}
                          required={true}
                          value={shippingInfo.country}
                        />
                      </div>
                    </div>
                    {/* Checkbox agreement */}
                    <div className="flex items-center justify-between mt-8">
                      <div>
                        <input
                          type="checkbox"
                          id="agreement"
                          className="mr-2"
                          required
                          checked={agreementChecked}
                          onChange={handleAgreementChange}
                        />
                        <label htmlFor="agreement" className="text-xs md:text-sm select-none">
                          I agree to the{' '}
                          <a
                            href="https://www.iubenda.com/terms-and-conditions/43241044"
                            className="underline"
                          >
                            terms and conditions
                          </a>
                        </label>
                      </div>
                      {/* button to save shipping information */}
                      <button
                        onClick={() => saveShippingAddress()}
                        disabled={isPending || !isFormValid}
                        className={`w-fit text-sm md:text-md  ${
                          isPending || !isFormValid
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-white text-black hover:bg-gray-100'
                        } font-bold py-3 px-6 rounded-full`}
                      >
                        Continue
                      </button>
                    </div>
                  </section>
                )}
              </div>

              <div className={`${cardStyling}`}>
                <h2 className="text-md md:text-xl font-semibold font-heading mb-6">
                  Payment Options
                </h2>
                <div className="space-y-4">
                  <PayPalButton {...paypalButtonConfig} fundingSource="paypal" />
                  <PayPalButton {...paypalButtonConfig} fundingSource="card" />
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <CartAccordion cart={cart} cardStyling={cardStyling} />
          </div>
        </div>
      </PayPalScriptProvider>
    </div>
  );
}
