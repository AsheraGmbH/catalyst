import { NextRequest, NextResponse } from "next/server";
import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrdersController,
} from "@paypal/paypal-server-sdk";
import { getCart } from "~/app/[locale]/(default)/cart/page-data";

// Load environment variables
const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, BIGCOMMERCE_STORE_HASH, BIGCOMMERCE_ACCESS_TOKEN } = process.env;
const storeHash = BIGCOMMERCE_STORE_HASH!;
const accessToken = BIGCOMMERCE_ACCESS_TOKEN!;
const paypalEnvironment: any = process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT!;

// Initialize PayPal client
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

const ordersController = new OrdersController(client);

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (orderId: string, grandTotal: number, taxTotal: number, currency: string) => {
    const collect = {
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    referenceId: orderId.toString(),
                    amount: {
                        currencyCode: currency,
                        value: grandTotal.toString(),
                        breakdown: {
                            itemTotal: {
                                currencyCode: currency,
                                value: (grandTotal - taxTotal).toString(),
                            },
                            shipping: {
                                currencyCode: currency,
                                value: "0.00",
                            },
                            taxTotal: {
                                currencyCode: currency,
                                value: taxTotal ? taxTotal.toString() : "0.00",
                            },
                        },
                    },
                },
            ],
        },
        prefer: "return=minimal",
    };

    try {
        const { result, ...httpResponse } = await ordersController.createOrder(collect);

        return {
            jsonResponse: result,
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message);
        }
        throw error;
    }
};

// POST /api/checkout/paypal/createOrder
export async function POST(request: NextRequest) {
    try {
        const { cartId, currency }: { cartId: string, currency: string } = await request.json();

        if (!currency) {
            throw new Error("Missing currency");
        }

        const data = await getCart({ cartId });

        if (!data) {
            throw new Error("Failed to retrieve cart data");
        }

        const checkout = data.site.checkout;
        const grandTotal = checkout?.grandTotal?.value;
        const taxTotal = checkout?.taxTotal?.value || 0;

        if(!grandTotal) {
            throw new Error("Missing grand total");
        }

        const orderRes = await fetch(
            `https://api.bigcommerce.com/stores/${storeHash}/v3/checkouts/${cartId}/orders`,
            {
                method: "POST",
                headers: {
                    "X-Auth-Token": accessToken,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    "payment_method": "PayPal",
                    "payment_status": "captured",
                }),
            }
        );

        const dataRes = await orderRes.json();
        console.log("Order Data:", dataRes, grandTotal, taxTotal);
        const { data: order } = dataRes;

        const { jsonResponse, httpStatusCode } = await createOrder(order.id, grandTotal, taxTotal, currency);
        return NextResponse.json(jsonResponse, { status: httpStatusCode });
    } catch (error) {
        console.error("Failed to create order:", error);
        return NextResponse.json(
            { error: "Failed to create order." },
            { status: 500 }
        );
    }
}

