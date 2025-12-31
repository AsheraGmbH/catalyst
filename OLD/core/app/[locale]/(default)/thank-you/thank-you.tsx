"use client";
import Image from "next/image";
import CartAccordion from "../checkout/_components/CartAccordion";
import { useEffect } from "react";
import { buildAddToCartPayload } from "@/vibes/soul/sections/product-detail/helper";
import { bodl } from "~/lib/bodl";

interface ThankYouPageClientProps{
    cart: any;
    shippingInfo: any;
    orderId: string;
    cartId: string;
    rawData: any;
}

export default function ThankYouPageClient({ rawData, cartId, orderId, cart, shippingInfo }: ThankYouPageClientProps){
    // SEND PURCHASE EVENT
    useEffect(() =>
    {
        const transformedPayload = buildAddToCartPayload(rawData.site.cart);
        if (transformedPayload)
        {
            bodl.checkout.productPurchased({
                ...transformedPayload,
                checkout_value: rawData.site.checkout.grandTotal.value,
                checkout_id: cartId,
                order_id: orderId?.toString(),
                tax_value: rawData.site.checkout.taxTotal.value,
                discount_value: rawData.site.checkout.cart.discountedAmount.value,
                shipping_cost: 0
            });
        }
    }, [cart, orderId, shippingInfo]);

    const cardStyling = `bg-[#181818] px-6 pt-4 pb-8 h-fit border-solid border-t-[1px] border-r-[1px] border-b-[3px] border-l-[1px] border-[#343434] rounded-lg`;
    return (
        <div className="container mx-auto px-4 md:px-0 py-2 pb-8 md:py-8 text-white">
            <div className="flex flex-col-reverse gap-y-4 md:flex-row md:gap-x-6">
                <div className="w-full md:w-2/3 flex flex-col gap-y-6">
                    <div className="flex items-center gap-x-4">
                        <img className="w-14 h-14 md:w-24 md:h-24" src={'https://res.cloudinary.com/giftie/image/upload/v1756736320/shipping_xnup5k.avif'} alt={'Shipping'} />
                        <div>
                            <p>Order #{orderId}</p>
                            <h1 className="text-xl md:text-4xl font-bold">Thank You, {shippingInfo.first_name}!</h1>
                        </div>
                    </div>

                    <div className={`${cardStyling}`}>
                        <h2 className="text-lg md:text-2xl font-semibold font-heading mb-6">Your Order is Confirmed</h2>
                        <div className="space-y-4">
                            <p className="text-sm md:text-base">We have accepted your order, and we're getting it ready. A confirmation mail has been sent to <span className="font-semibold">{shippingInfo.email}</span></p>
                        </div>
                    </div>

                    <div className={`${cardStyling}`}>
                        <div className='flex items-center justify-between mb-6'>
                            <h2 className="text-md md:text-xl font-semibold font-heading">Customer Information</h2>
                        </div>
                        <section className='flex flex-col gap-y-2 text-sm md:text-base'>
                            {/* email */}
                            <div>
                                <span className="font-semibold">Email:</span> {shippingInfo.email}  
                            </div>
                            <div>
                                <span className="font-semibold">First Name:</span> {shippingInfo.first_name}
                            </div>
                            <div>
                                <span className="font-semibold">Last Name:</span> {shippingInfo.last_name}
                            </div>
                            <div>
                                <span className="font-semibold">Shipping Address:</span> {shippingInfo.street_1}, {shippingInfo.city}, {shippingInfo.state}, {shippingInfo.zip}, {shippingInfo.country}
                            </div>
                        </section>
                    </div>
                </div>
                <CartAccordion thankYouPage cart={cart} cardStyling={cardStyling} />
            </div>
        </div>
    )
}