import { NextRequest, NextResponse } from "next/server";
import {
    ApiError,
    OrdersController,
    Client,
    Environment,
    LogLevel,
} from "@paypal/paypal-server-sdk";
import { encryptObject } from "~/app/[locale]/(default)/thank-you/_utils/order";
import { getCart } from "~/app/[locale]/(default)/cart/page-data";
import { countries } from "~/app/[locale]/(default)/checkout/data";
const paypalEnvironment: any = process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT!;

const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, BIGCOMMERCE_STORE_HASH, BIGCOMMERCE_ACCESS_TOKEN } = process.env;

// Initialize PayPal client (assuming same configuration as createOrder)
const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET!,
    },
    timeout: 0,
    environment: paypalEnvironment === "production" ? Environment.Production : Environment.Sandbox,
    logging: {
        logLevel: LogLevel.Info,
        logRequest: {
            logBody: true,
        },
        logResponse: {
            logHeaders: true,
        },
    },
});
const accessToken = BIGCOMMERCE_ACCESS_TOKEN!;
const storeHash = BIGCOMMERCE_STORE_HASH!;

const ordersController = new OrdersController(client);

// Retry utility function with exponential backoff
const retryFetch = async (url: string, options: RequestInit, maxRetries: number = 3, baseDelay: number = 1000): Promise<Response> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            if (attempt === maxRetries) {
                throw lastError;
            }
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError || new Error('Retry failed');
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID: string, cartId: string, type: string = 'normal') => {
    const collect = {
        id: orderID,
        prefer: "return=minimal",
    };

    try {
        const { result, ...httpResponse } = await ordersController.captureOrder(collect);
        console.log("Capture order response:", result)

        // @ts-ignore
        // if no purchase_units are found, throw an error
        if (result?.purchaseUnits.length === 0) {
            throw new Error("No purchase units found");
        }

        // if no captures are found, throw an error
        if (!result.purchaseUnits![0]?.payments?.captures || result.purchaseUnits![0]?.payments?.captures.length === 0) {
            throw new Error("No captures found");
        }

        const nonce = result.purchaseUnits![0]?.payments?.captures![0]?.id;
        const orderId = result.purchaseUnits![0]?.referenceId;

        // get the cart
        const cart = await getCart({ cartId });

        if (type === 'oneclick') {
            // Add shipping information for one-click payment with retry
            const shippingResponse = await retryFetch(
                `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}/shipping_addresses`,
                {
                    method: "GET",
                    headers: {
                        "X-Auth-Token": accessToken,
                        "Content-Type": "application/json",
                    }
                },
                3, // maxRetries
                1000 // baseDelay in milliseconds
            );

            const shippingInfo = await shippingResponse.json();
            if (shippingInfo.length > 0) {
                const id = shippingInfo[0].id;
                const { address } = result.purchaseUnits![0].shipping!;
                const { name, emailAddress } = result.payer!;

                await retryFetch(
                    `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}/shipping_addresses/${id}`,
                    {
                        method: "PUT",
                        headers: {
                            "X-Auth-Token": accessToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            "first_name": name?.givenName,
                            "last_name": name?.surname,
                            "street_1": address?.addressLine1,
                            "street_2": address?.addressLine2,
                            "state": address?.adminArea1,
                            "city": address?.adminArea2,
                            "zip": address?.postalCode,
                            "country": countries.find(c => c.code === address?.countryCode)?.name,
                            "country_iso2": address?.countryCode,
                            "email": emailAddress
                        })
                    },
                    3, // maxRetries
                    1000 // baseDelay in milliseconds
                );

                await retryFetch(
                    `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`,
                    {
                        method: "PUT",
                        headers: {
                            "X-Auth-Token": accessToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            "status_id": 7, // Awaiting Payment
                            "billing_address": {
                                "first_name": name?.givenName,
                                "last_name": name?.surname,
                                "street_1": address?.addressLine1,
                                "street_2": address?.addressLine2,
                                "state": address?.adminArea1,
                                "city": address?.adminArea2,
                                "zip": address?.postalCode,
                                "country": countries.find(c => c.code === address?.countryCode)?.name,
                                "country_iso2": address?.countryCode,
                                "email": emailAddress
                            }
                        }),
                    }
                );
            }
        } else {
            await retryFetch(
                `https://api.bigcommerce.com/stores/${storeHash}/v2/orders/${orderId}`,
                {
                    method: "PUT",
                    headers: {
                        "X-Auth-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "status_id": 7, // Awaiting Payment
                    }),
                }
            );
        }

        const thankYouPageId = await encryptObject({ orderId, cart });
        console.log("Thank You Page ID:", thankYouPageId);

        return {
            jsonResponse: {
                "status": "success",
                "data": {
                    nonce,
                    orderId,
                    thankYouPageId
                },
            },
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message);
        }
        throw error;
    }
};

// POST /api/checkout/paypal/captureOrder
export async function POST(request: NextRequest) {
    try {
        const { orderID, cartId, type } = await request.json();
        if (!orderID) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        const { jsonResponse, httpStatusCode } = await captureOrder(orderID, cartId, type);

        return NextResponse.json(jsonResponse, { status: httpStatusCode });
    } catch (error) {
        console.error("Failed to capture order:", error);
        return NextResponse.json(
            { error: "Failed to capture order." },
            { status: 500 }
        );
    }
}

