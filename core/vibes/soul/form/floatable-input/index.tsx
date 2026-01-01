import { clsx } from 'clsx';
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { FieldError } from '@/vibes/soul/form/field-error';

export const Label = ({
    className,
    ...rest
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) => {
    return (
        <LabelPrimitive.Root
            {...rest}
            className={clsx(
                // Mobile: floating label inside input
                'pointer-events-none absolute left-6 peer-[&:not(:placeholder-shown)]:top-[59%] top-1/2 peer-focus:top-[59%] -translate-y-1/2 text-sm text-contrast-500 transition-all duration-200 peer-focus:-translate-y-6 peer-focus:text-[8px] peer-focus:text-contrast-300 peer-[&:not(:placeholder-shown)]:-translate-y-6 peer-[&:not(:placeholder-shown)]:text-[8px] peer-[&:not(:placeholder-shown)]:text-contrast-300',
                // Non-mobile: block label above input
                'md:block md:font-mono md:text-xs md:uppercase md:text-white md:static md:translate-y-0',
                className
            )}
        />
    );
};

export const Input = React.forwardRef<
    React.ComponentRef<'input'>,
    Omit<React.ComponentPropsWithoutRef<'input'>, 'id'> & {
        prepend?: React.ReactNode;
        label?: string;
        errors?: string[];
        checkedValue?: string;
    }
>(({ prepend, label, className, required, errors, checkedValue, onChange, ...rest }, ref) => {
    const id = React.useId();

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) onChange(event);

        const input = event.target;
        const checkboxId = checkedValue;

        if (checkboxId) {
            const checkboxInput = document.querySelector(
                `input[type="checkbox"][name="${checkboxId}"]`
            ) as HTMLInputElement;
            const checkboxButton = checkboxInput?.previousElementSibling as HTMLButtonElement | null;

            if (checkboxButton && checkboxInput) {
                const hasValue = input.value.trim() !== '';
                const isChecked = checkboxButton.getAttribute('data-state') === 'checked';
                const isFalse = checkboxButton.getAttribute('value') === 'false';

                if (hasValue && (!isChecked || isFalse)) {
                    checkboxButton.click();
                } else if (!hasValue && isChecked) {
                    checkboxButton.click();
                }
            }
        }
    };

    return (
        <div className={clsx('w-full space-y-2', className)}>
            {label != null && label !== '' && <Label htmlFor={id} className="hidden md:block">{label}</Label>}
            <div
                className={clsx(
                    'relative overflow-hidden rounded-full border-2 bg-background transition-colors duration-200 focus-within:border-background',
                    errors && errors.length > 0 ? 'border-error' : 'border-contrast-900'
                )}
            >
                {prepend != null && prepend !== '' && (
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                        {prepend}
                    </span>
                )}
                <input
                    {...rest}
                    onChange={handleInput}
                    className={clsx(
                        'peer w-full bg-[#1d1d1d] px-6 py-3 text-sm text-background [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                        { 'py-2.5 pe-4 ps-12': prepend },
                        // Hide placeholder on mobile, show on non-mobile
                        'placeholder-transparent md:placeholder-gray-500 md:placeholder:font-normal'
                    )}
                    id={id}
                    ref={ref}
                    placeholder={label || ' '} // Placeholder for mobile floating effect
                />
                {label != null && label !== '' && <Label htmlFor={id} className="md:hidden">{label}</Label>}
            </div>
            {errors?.map((error) => (
                <FieldError key={error}>{error}</FieldError>
            ))}
        </div>
    );
});

Input.displayName = 'Input';
