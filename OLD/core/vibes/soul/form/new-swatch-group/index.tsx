'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { FieldError } from '@/vibes/soul/form/field-error';
import { Label } from '@/vibes/soul/form/label';
import { useFormatter } from 'next-intl';

// Function to normalize strings for comparison
function normalizeString(str: string)
{
  return str.toUpperCase().replace(/\s+/g, ' ').split(' ');
}

// Function to map label to SKU prefix
function getSkuPrefix(label: string)
{
  if (label.toLowerCase().includes('buckeye burl light'))
  {
    return ['BUCKEYE-L'];
  }
  if (label.toLowerCase().includes('buckeye burl dark'))
  {
    return ['BUCKEYE-D'];
  }
  // For general cases, remove spaces and use the label as is
  return normalizeString(label);
}

// Function to find matching SKU
function findMatchingSku(label: string, skus: Record<string, any>): string | null
{
    const prefixes = getSkuPrefix(label);

    // Iterate through prefixes to find the first matching SKU
    for (const prefix of prefixes)
    {
        // Check if any SKU key matches exactly or contains the prefix
        for (const sku of Object.keys(skus))
        {
            const skuUpper = sku.toUpperCase();
            if (skuUpper === prefix || skuUpper.includes(prefix))
            {
                return sku; // Return the first matching SKU
            }
        }
    }

    return null; // Return null if no match is found
}

type Props = {
  id?: string;
  name: string;
  defaultPrice?: number;
  currencyCode?: string;
  variantPrices?: Record<string, number>;
  pending?: boolean;
  placeholder?: string;
  label?: string;
  hideLabel?: boolean;
  variant?: 'round' | 'rectangle';
  options: Array<{ label: string; value: string; color?: string }>;
  className?: string;
  errors?: string[];
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  onOptionMouseEnter?: (value: string) => void;
  onTrackSelection?: (value: string) => void; // Added to notify tracking
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

export function NewSwatchGroup({
  label,
  defaultPrice,
  variantPrices,
  currencyCode,
  hideLabel = false,
  name,
  pending = false,
  placeholder = 'Select an item',
  variant = 'round',
  options,
  className,
  errors,
  onFocus,
  onBlur,
  onOptionMouseEnter,
  onTrackSelection,
  value,
  ...rest
}: Props)
{
    const id = React.useId();
    const format = useFormatter();


    // Merge prices into the colors array
    const result = options.map(color =>
    {
        const sku = findMatchingSku(color.label, variantPrices!);
        return {
            ...color,
            price: sku ? variantPrices![sku] : null // Add price if SKU is found, else null
        };
    });

    const selectedOption = result.find((option) => option.value === value);

    return (
        <div className={clsx('w-full space-y-2', className)}>
        {label !== undefined && label !== '' && (
            <Label className={clsx(hideLabel && 'sr-only', 'mb-2')} htmlFor={id}>
            {label}
            </Label>
        )}
        <div className='flex items-center justify-between gap-3'>
            <div className='border-2 h-12 w-12 rounded-full shrink-0 border-white ' style={{ backgroundColor: selectedOption?.color }}></div>
            <SelectPrimitive.Root 
                {...rest} 
                value={value}
                onValueChange={(newValue) =>
                {
                    onTrackSelection?.(newValue); // Notify tracking of selection
                    rest.onValueChange?.(newValue); // Call original onValueChange if provided
                }}
            >
                <SelectPrimitive.Trigger
                    aria-label={label}
                    className={clsx(
                        'flex h-fit w-full select-none items-center text-white justify-between gap-3 border-2 bg-[#232323] p-2 px-5 py-3 text-sm font-medium text-foreground ring-[#5d5757] transition-colors hover:border-contrast-400 hover:bg-[#232323] focus-visible:outline-none focus-visible:ring-2',
                        variant === 'rectangle' ? 'rounded-lg' : 'rounded-full',
                        errors && errors.length > 0 ? 'border-error' : 'border-contrast-900',
                    )}
                    data-pending={pending ? true : null}
                    id={id}
                    name={name}
                    onBlur={onBlur}
                    onFocus={onFocus}
                >
                <SelectPrimitive.Value placeholder={placeholder} />
                <SelectPrimitive.Icon asChild>
                    <ChevronDown className="w-5 text-white transition-transform" strokeWidth={1.5} />
                </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                <SelectPrimitive.Content className="z-50 max-h-80 w-full overflow-y-scroll rounded-xl bg-[#1d1d1d] p-2 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 @4xl:rounded-3xl @4xl:p-4">
                    <SelectPrimitive.ScrollUpButton className="flex w-full cursor-default items-center justify-center py-3">
                    <ChevronUp className="w-5 text-foreground" strokeWidth={1.5} />
                    </SelectPrimitive.ScrollUpButton>
                    <SelectPrimitive.Viewport>
                    {result.map((option) => {
                        const priceDiff = (option?.price ?? 0) - (defaultPrice ?? 0);
                        return (
                            <SelectPrimitive.Item
                                className="w-full flex justify-between items-center gap-3 cursor-default select-none rounded-xl px-3 py-2 text-sm font-medium text-contrast-400 outline-none transition-colors hover:!bg-[#282727] hover:!text-background focus-visible:bg-contrast-100 focus-visible:text-foreground data-[state=checked]:text-background @4xl:text-base"
                                key={option.value}
                                onMouseEnter={() =>
                                {
                                    onOptionMouseEnter?.(option.value);
                                }}
                                value={option.value}
                            >
                                <div className="flex items-center gap-2">
                                    <div className='border-2 h-6 w-6 rounded-full border-white' style={{ backgroundColor: option?.color }}></div>
                                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                </div>
                                <div className="flex text-xs items-center justify-center gap-1 px-4 py-1 text-black bg-white rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="8" fill="none"><path fill="#D1AB4D" d="M3.75 5.876 9.167.459l.833.833-6.25 6.25L0 3.792l.833-.833z" /></svg>
                                    {priceDiff === 0 && (
                                        <div>
                                            Incl.
                                        </div>
                                    )}
                                    {priceDiff > 0 && priceDiff !== defaultPrice && (
                                        <div>
                                            {priceDiff > 0 ? '+' : ''}
                                            {
                                                format.number(priceDiff, {
                                                    style: 'currency',
                                                    currency: currencyCode,
                                                })
                                            }
                                        </div>
                                    )}
                                </div>
                            </SelectPrimitive.Item>
                        );
                    })}
                    </SelectPrimitive.Viewport>
                    <SelectPrimitive.ScrollDownButton className="flex w-full cursor-default items-center justify-center py-3">
                    <ChevronDown className="w-5 text-foreground" strokeWidth={1.5} />
                    </SelectPrimitive.ScrollDownButton>
                </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        </div>
        {errors?.map((error) => <FieldError key={error}>{error}</FieldError>)}
        </div>
    );
}
