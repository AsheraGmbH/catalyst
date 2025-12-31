import { clsx } from 'clsx';
import * as React from 'react';

import { FieldError } from '@/vibes/soul/form/field-error';
import { Label } from '@/vibes/soul/form/label';

export const Input = React.forwardRef<
  React.ComponentRef<'input'>,
  Omit<React.ComponentPropsWithoutRef<'input'>, 'id'> & {
    prepend?: React.ReactNode;
    label?: string;
    errors?: string[];
    checkedValue?: string;
  }
  >(({ prepend, label, className, required, errors, checkedValue, onChange, ...rest }, ref) =>
{
  const id = React.useId();

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) =>
  {
    // Call the original onChange if provided
    if (onChange) onChange(event);

    const input = event.target;
    const checkboxId = checkedValue;

    if (checkboxId)
    {
      const checkboxInput = document.querySelector(`input[type="checkbox"][name="${checkboxId}"]`) as HTMLInputElement;
      const checkboxButton = checkboxInput?.previousElementSibling as HTMLButtonElement | null;

      if (checkboxButton && checkboxInput)
      {
        const hasValue = input.value.trim() !== "";
        const isChecked = checkboxButton.getAttribute("data-state") === "checked";
        const isFalse = checkboxButton.getAttribute("value") === "false";

        // Click the button to check/uncheck if needed
        if (hasValue && (!isChecked || isFalse))
        {
          checkboxButton.click();
        } else if (!hasValue && isChecked)
        {
          checkboxButton.click();
        }
      }
    }
  };

  return (
    <div className={clsx('w-full space-y-2', className)}>
      {label != null && label !== '' && <Label htmlFor={id}>{label}</Label>}
      <div
        className={clsx(
          'relative overflow-hidden rounded-full border-2 bg-background transition-colors duration-200 focus-within:border-background focus:outline-none',
          errors && errors.length > 0 ? 'border-error' : 'border-contrast-900',
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
            'placeholder-contrast-gray-500 w-full bg-[#1d1d1d] px-6 py-3 text-sm text-background [appearance:textfield] placeholder:font-normal focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            { 'py-2.5 pe-4 ps-12': prepend },
          )}
          id={id}
          ref={ref}
        />
      </div>
      {errors?.map((error) => <FieldError key={error}>{error}</FieldError>)}
    </div>
  );
});

Input.displayName = 'Input';
