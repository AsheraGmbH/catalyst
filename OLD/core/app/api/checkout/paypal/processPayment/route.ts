import { NextResponse } from "next/server";
import braintree from "braintree";
import axios from "axios";

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // or Production
    merchantId: process.env.BRAINTREE_MERCHANT_ID || 'qcnv747dbxt7nfzs',
    publicKey: process.env.BRAINTREE_PUBLIC_KEY || 'ywwyn3sjnbrw9bsm',
    privateKey: process.env.BRAINTREE_PRIVATE_KEY || 'c9bf2061be36d1b4d7b1886bcca7c24e',
});
const accessToken = process.env.BIGCOMMERCE_ACCESS_TOKEN || '16jdtoq4co6ov6qyr10eqqfdi5127z9';
const storeHash = process.env.BIGCOMMERCE_STORE_HASH!;

// POST /api/checkout/paypal/processPayment
export async function POST(request: any)
{
    try
    {
        const { nonce, cartId } = await request.json();
        const result = await gateway.transaction.sale({
            amount: "360.00",
            paymentMethodNonce: nonce,
            options: {
                submitForSettlement: true,
            },
        });

        if (result.success)
        {
            const jsonResponse = { success: true, transactionId: result.transaction.id };

            // Step 3: Convert Checkout into Order
            const orderRes = await fetch(
                `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v3/checkouts/${cartId}/orders`,
                {
                    method: "POST",
                    headers: {
                        "X-Auth-Token": process.env.BC_API_TOKEN!,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "payment_method": "Braintree PayPal",
                        "payment_status": "captured",
                        "external_id": result.transaction.id
                    }),
                }
            );

            const order = await orderRes.json();

            // Step 4: Move Order to Awaiting Payment
            await fetch(
                `https://api.bigcommerce.com/stores/${process.env.BC_STORE_HASH}/v2/orders/${order.data.id}`,
                {
                    method: "PUT",
                    headers: {
                        "X-Auth-Token": process.env.BC_API_TOKEN!,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status_id: 7, // Awaiting Payment
                    }),
                }
            );

            const httpStatusCode = 200;
            return NextResponse.json(jsonResponse, { status: httpStatusCode });
        } else
        {
            const jsonResponse = { success: false, error: result.message };
            const httpStatusCode = 400;
            return NextResponse.json(jsonResponse, { status: httpStatusCode });
        }
    } catch (error)
    {
        console.error("Failed to create order:", error);
        return NextResponse.json(
            { error: "Failed to create order." },
            { status: 500 }
        );
    }
}