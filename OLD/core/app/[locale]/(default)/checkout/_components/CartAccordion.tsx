import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Image } from '~/components/image';
import Timeline from './Timeline';

interface CartProps
{
    lineItems: any;
    total: string;
    summaryItems: any;
    totalLabel: string;
}

interface CartAccordionProps
{
    cart: CartProps;
    cardStyling: string;
    thankYouPage?: boolean;
}

const CartAccordion: React.FC<CartAccordionProps> = ({ cart, cardStyling, thankYouPage= false }) =>
{
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () =>
    {
        setIsOpen(!isOpen);
    };
    
    const isEngraving = cart.lineItems.some((lineItem: any) =>
        lineItem.selectedOptions.find((option:any) => option.name === 'engraving-checkbox')?.value === 'Yes'
    );

    return (
        <div className={`w-full md:w-1/3 ${cardStyling} ${!isOpen && '!pb-4 md:!pb-8'}`}>
            {/* Accordion Header */}
            <button
                className="w-full flex justify-between visible md:hidden items-center text-white rounded-md md:bg-transparent md:p-0"
                onClick={toggleAccordion}
            >
                <div className="flex items-center gap-x-2">
                    <span className="text-md flex items-center gap-x-1 font-semibold font-heading">
                        {isOpen ? 'Hide Order Summary' : 'Show Order Summary'}
                        {/* if its open, add accordion icon */}
                        {isOpen ? (<ArrowUpIcon className='w-3 h-3' />) : (<ArrowDownIcon className="w-3 h-3" />)}
                        
                    </span>
                </div>
                {!isOpen && <span className="font-bold text-md">{cart.total}</span>}
            </button>

            {/* Accordion Content */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen mt-4' : 'max-h-0'
                    } md:max-h-screen md:mt-0`}
            >
                <h2 className="text-xl font-semibold mb-8 font-heading hidden md:block">{thankYouPage ? 'Order Details' : 'Your Cart'}</h2>
                {cart.lineItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between mb-2 gap-x-2 items-center">
                        <div className="flex gap-x-2 items-center">
                            <Image
                                src={item.image.src}
                                alt={item.image.alt}
                                width={60}
                                height={60}
                                className="object-cover rounded-md"
                            />
                            <div className="flex flex-col gap-y-1">
                                <span className="text-sm text-white font-bold">{item.title}</span>
                                <span className="text-contrast-300 text-xs contrast-more:text-contrast-500">
                                    {item.subtitle}
                                </span>
                            </div>
                        </div>
                        <span className="font-bold text-sm">{item.price}</span>
                    </div>
                ))}
                {/* Divider */}
                <div className="border-t border-gray-600 mb-4 mt-6" />
                {
                    thankYouPage && <div className="flex justify-between mt-4">
                        <span>Payment method</span>
                        <span>PayPal</span>
                    </div>
                }
                {cart.summaryItems.map((summaryItem:any, index:any) => (
                    <div className="flex justify-between mt-4 text-white" key={index}>
                        <dt>{summaryItem.label}</dt>
                        <dd>{summaryItem.value}</dd>
                    </div>
                ))}
                <div className="flex justify-between mt-4">
                    <span>Shipping</span>
                    <span>FREE</span>
                </div>
                <div className="flex justify-between font-bold mt-4">
                    <span>{cart.totalLabel ?? 'Total'}</span>
                    <span>{cart.total}</span>
                </div>

                <div className="border-t border-gray-600 mb-4 mt-6" />
                <Timeline isEngraving={isEngraving} />
            </div>
        </div>
    );
};

export default CartAccordion;