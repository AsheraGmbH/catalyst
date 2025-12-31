'use client';

import {
  FieldMetadata,
  FormProvider,
  FormStateInput,
  getFormProps,
  SubmissionResult,
  useForm,
  useInputControl,
} from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { createSerializer, parseAsString, useQueryStates } from 'nuqs';
import { ReactNode, useActionState, useCallback, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { z } from 'zod';

import { ButtonRadioGroup } from '@/vibes/soul/form/button-radio-group';
import { CardRadioGroup } from '@/vibes/soul/form/card-radio-group';
import { Checkbox } from '@/vibes/soul/form/checkbox';
import { FormStatus } from '@/vibes/soul/form/form-status';
import { Input } from '@/vibes/soul/form/input';
import { NumberInput } from '@/vibes/soul/form/number-input';
import { RadioGroup } from '@/vibes/soul/form/radio-group';
import { Select } from '@/vibes/soul/form/select';
import { Button } from '@/vibes/soul/primitives/button';
import { toast } from '@/vibes/soul/primitives/toaster';
import { usePathname, useRouter } from '~/i18n/routing';

import { Field, schema, SchemaRawShape } from './schema';
import { bodl } from '~/lib/bodl';
import { buildAddToCartPayload } from './helper';
import { NewSwatchGroup } from '../../form/new-swatch-group';
import { ProductDetailProduct } from '.';
import { ArrowRight } from 'lucide-react';
import { CartIcon, LockIcon } from '../footer/payment-icons';
import { ApplePayIcon } from '~/components/footer/payment-icons/apple-pay';
import { MastercardIcon } from '~/components/footer/payment-icons/mastercard';
import { PayPalIcon } from '~/components/footer/payment-icons/paypal';
import { VisaIcon } from '~/components/footer/payment-icons/visa';
import { AmericanExpressIcon } from '~/components/footer/payment-icons/american-express';
import { AmazonIcon } from '~/components/footer/payment-icons/amazon';
import { usePageTracking } from './hooks/usePageTracking';

type Action<S, P> = (state: Awaited<S>, payload: P) => S | Promise<S>;

interface State<F extends Field> {
  fields: F[];
  lastResult: SubmissionResult | null;
  successMessage?: ReactNode;
  cartId?: string;
  redirectUrl?: string;
}

export type ProductDetailFormAction<F extends Field> = Action<State<F>, FormData>;

interface Props<F extends Field> {
  fields: F[];
  action: ProductDetailFormAction<F>;
  checkoutAction: ProductDetailFormAction<F>;
  product: ProductDetailProduct | null;
  productId: string;
  ctaLabel?: string;
  checkoutLabel?: string;
  quantityLabel?: string;
  incrementLabel?: string;
  decrementLabel?: string;
  ctaDisabled?: boolean;
  prefetch?: boolean;
}

function updateFormConfig(config: Field[]): any
{
  const updatedConfig: Field[] = config.map(item => ({ ...item }));

  const checkboxes = new Map<string, Field>();
  updatedConfig.forEach(item =>
  {
    if (item.type === "checkbox" && item.label?.endsWith("-checkbox"))
    {
      const baseLabel = item.label.replace("-checkbox", "");
      checkboxes.set(baseLabel, item);
    }
  });

  updatedConfig.forEach(item =>
  {
    if (item.type === "text" && item.label && checkboxes.has(item.label))
    {
      const checkbox = checkboxes.get(item.label)!;
      checkbox.hidden = true;
      item.checkedValue = checkbox.name;
    }
  });

  return updatedConfig;
}

export function ProductDetailForm<F extends Field>({
  action,
  checkoutAction,
  fields,
  product,
  productId,
  ctaLabel = 'Add to cart',
  checkoutLabel = 'Buy Now',
  quantityLabel = 'Quantity',
  incrementLabel = 'Increase quantity',
  decrementLabel = 'Decrease quantity',
  ctaDisabled = false,
  prefetch = false,
}: Props<F>) {
  const router = useRouter();
  const pathname = usePathname();
  const { isTrackEligible } = usePageTracking('color');
  const [actionType, setActionType] = useState<'add-to-cart' | 'checkout'>('add-to-cart'); // State to track action type

  // make all the fields persist
  fields = fields.map((field) => ({ ...field, persist: true }));

  const searchParams = fields.reduce<Record<string, typeof parseAsString>>((acc, field) => {
    return field.persist === true ? { ...acc, [field.name]: parseAsString } : acc;
  }, {});

  const [params] = useQueryStates(searchParams, { shallow: false });

  // go through the fields, get the field that has type checkbox and get the checkedValue and uncheckedValue.. once you have the value, you can use it to determine the value of the checkbox in params, if value in param is checkedValue make it true else false
  fields.forEach((field) => {
    if(field.type === 'checkbox' && field.checkedValue && field.uncheckedValue) {
      params[field.name] = params[field.name] === field.checkedValue ? "true" : "false";
    }
  });

  fields = updateFormConfig(fields);

  const onPrefetch = (fieldName: string, value: string) => {
    if (prefetch) {
      const serialize = createSerializer(searchParams);

      const newUrl = serialize(pathname, { ...params, [fieldName]: value });

      router.prefetch(newUrl);
    }
  };

  const defaultValue = fields.reduce<{
    [Key in keyof SchemaRawShape]?: z.infer<SchemaRawShape[Key]>;
  }>(
    (acc, field) => ({
      ...acc,
      [field.name]: params[field.name] ?? field.defaultValue ?? '',
    }),
    { quantity: 1 },
  );

  const [{ lastResult, successMessage, cartId, redirectUrl }, formAction] = useActionState(
    actionType === 'add-to-cart' ? action : checkoutAction, // Use actionType to select the action
    { fields, lastResult: null },
  );

  useEffect(() =>
  {
    if (lastResult?.status === 'success' && actionType === 'add-to-cart')
    {
      (async () =>
      {
        const res = await fetch('/api/cart/getCart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId }),
        });

        const { error, cart } = await res.json();

        if (error)
        {
          return;
        }

        // Update Bodl state
        const transformedPayload = buildAddToCartPayload(cart);
        const eligible = isTrackEligible();

        if (transformedPayload && eligible)
        {
          bodl.cart.productAdded(transformedPayload);
        }
        const redirectUrl = `/cart?id=${cartId}`;
        router.push(redirectUrl, { scroll: true });
      })();
    } else if (lastResult?.status === 'success' && actionType === 'checkout' && redirectUrl)
    {
      (async () =>
      {
        const res = await fetch('/api/cart/getCart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId }),
        });

        const { error, cart } = await res.json();

        if (error)
        {
          return;
        }

        // Update Bodl state
        const transformedPayload = buildAddToCartPayload(cart);
        const eligible = isTrackEligible();
        
        if (transformedPayload && eligible)
        {
          bodl.cart.productAdded(transformedPayload);
        }
        const redirectUrl = '/checkout';
        router.push(redirectUrl, { scroll: true });
      })();
    }
  }, [lastResult, actionType, cartId]);

  // useEffect(() => {
  //   if (lastResult?.status === 'success') {
  //     toast.success(successMessage);
  //   }
  // }, [lastResult, successMessage]);

  const [form, formFields] = useForm({
    lastResult,
    constraint: getZodConstraint(schema(fields)),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: schema(fields) });
    },
    // @ts-expect-error: `defaultValue` types are conflicting with `onValidate`.
    defaultValue,
    shouldValidate: 'onSubmit',
    shouldRevalidate: 'onInput',
  });

  const quantityControl = useInputControl(formFields.quantity);

  return (
    <FormProvider context={form.context}>
      <FormStateInput />
      <form {...getFormProps(form)} action={formAction} className="pb-4">
        <input name="id" type="hidden" value={productId} />
        <input name="actionType" type="hidden" value={actionType} /> {/* Hidden input for action type */}
        <div className="space-y-6">
          {fields.map((field) => {
            return (
              <FormField
                product={product}
                field={field}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                formField={formFields[field.name]!}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                key={formFields[field.name]!.id}
                onPrefetch={onPrefetch}
              />
            );
          })}
          {form.errors?.map((error, index) => (
            <FormStatus className="pt-3" key={index} type="error">
              {error}
            </FormStatus>
          ))}
          <div className="flex flex-col md:flex-row md:items-start gap-y-3 md:gap-x-3 md:pt-3">
            {/* <NumberInput
              aria-label={quantityLabel}
              decrementLabel={decrementLabel}
              incrementLabel={incrementLabel}
              min={1}
              name={formFields.quantity.name}
              onBlur={quantityControl.blur}
              onChange={(e) => quantityControl.change(e.currentTarget.value)}
              onFocus={quantityControl.focus}
              required
              value={quantityControl.value}
            /> */}
            <div className='flex flex-col items-center gap-3'>
              <div className='flex flex-row w-full gap-3'>
                <SubmitButton
                  type="add-to-cart"
                  actionType={actionType}
                  disabled={ctaDisabled}
                  onClick={() => setActionType('add-to-cart')} // Set action type for Add to Cart
                >
                  <CartIcon key="cart" />
                  {ctaLabel}
                </SubmitButton>
                <SubmitButton
                  type="checkout"
                  actionType={actionType}
                  disabled={ctaDisabled}
                  onClick={() => setActionType('checkout')} // Set action type for Checkout
                >
                  <LockIcon key="lock" />
                  {checkoutLabel} 
                  <ArrowRight size={20} strokeWidth={1} />
                </SubmitButton>
              </div>
              <div className='flex flex-row items-center gap-2 mt-2 md:mt-0'>
                  <AmazonIcon key="amazon" />
                  <AmericanExpressIcon key="amex" />
                  <ApplePayIcon key="apple" />
                  <MastercardIcon key="mastercard" />
                  <PayPalIcon key="paypal" />
                  <VisaIcon key="visa" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

function SubmitButton({
  type,
  actionType,
  children,
  disabled,
  onClick,
}: { type: 'add-to-cart' | 'checkout'; actionType: 'add-to-cart' | 'checkout'; children: React.ReactNode; disabled?: boolean; onClick?: () => void })
{
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full @xl:w-[12rem]"
      disabled={disabled || pending}
      loading={pending && actionType === type}
      size="medium"
      type="submit"
      onClick={onClick} // Handle click to set action type
    >
      {children}
    </Button>
  );
}

function FormField({
  product,
  field,
  formField,
  onPrefetch,
}: {
  product: ProductDetailProduct | null;
  field: Field;
  formField: FieldMetadata<string | number | boolean | Date | undefined>;
  onPrefetch: (fieldName: string, value: string) => void;
}) {
  const controls = useInputControl(formField);

  // make all the fields persist
  field = { ...field, persist: true };

  const [, setParams] = useQueryStates(
    field.persist === true ? { [field.name]: parseAsString.withOptions({ shallow: false }) } : {},
  );

  const handleChange = useCallback(
    (value: string) => {
      if(field.type === 'checkbox' && field.checkedValue && field.uncheckedValue) {
        value = value === "true" ? field.checkedValue : field.uncheckedValue;
      }
      void setParams({ [field.name]: value });
      controls.change(value);
    },
    [setParams, field, controls],
  );

  const handleOnOptionMouseEnter = (value: string) => {
    if (field.persist === true) {
      onPrefetch(field.name, value);
    }
  };

  switch (field.type) {
    case 'number':
      return (
        <NumberInput
          decrementLabel={field.decrementLabel}
          errors={formField.errors}
          incrementLabel={field.incrementLabel}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onFocus={controls.focus}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );

    case 'text':
      return (
        <Input
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          checkedValue={field.checkedValue}
          name={formField.name}
          onBlur={controls.blur}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onFocus={controls.focus}
          required={formField.required}
          value={controls.value ?? ''}
          placeholder='Enter text here...'
        />
      );

    case 'checkbox':
      return (
        <Checkbox
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          name={formField.name}
          hidden={field.hidden}
          onBlur={controls.blur}
          onCheckedChange={(value) => handleChange(String(value))}
          onFocus={controls.focus}
          required={formField.required}
          defaultChecked={controls.value === "true"}
          value={controls.value ?? 'false'}
        />
      );

    case 'select':
      return (
        <Select
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onFocus={controls.focus}
          onOptionMouseEnter={handleOnOptionMouseEnter}
          onValueChange={handleChange}
          options={field.options}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );

    case 'radio-group':
      return (
        <RadioGroup
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onFocus={controls.focus}
          onOptionMouseEnter={handleOnOptionMouseEnter}
          onValueChange={handleChange}
          options={field.options}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );

    case 'swatch-radio-group':
      const { handleSelectChange } = usePageTracking('color', controls.value ?? '');
      return (
        <NewSwatchGroup
          errors={formField.errors}
          defaultPrice={product!.defaultPrice}
          variantPrices={product!.variantPrices}
          currencyCode={product!.currencyCode}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onFocus={controls.focus}
          onOptionMouseEnter={handleOnOptionMouseEnter}
          onValueChange={handleChange}
          options={field.options}
          onTrackSelection={handleSelectChange}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );

    case 'card-radio-group':
      return (
        <CardRadioGroup
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onFocus={controls.focus}
          onOptionMouseEnter={handleOnOptionMouseEnter}
          onValueChange={handleChange}
          options={field.options}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );

    case 'button-radio-group':
      return (
        <ButtonRadioGroup
          errors={formField.errors}
          key={formField.id}
          label={field.label}
          name={formField.name}
          onBlur={controls.blur}
          onFocus={controls.focus}
          onOptionMouseEnter={handleOnOptionMouseEnter}
          onValueChange={handleChange}
          options={field.options}
          required={formField.required}
          value={controls.value ?? ''}
        />
      );
  }
}