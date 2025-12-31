'use server';

import { BigCommerceGQLError } from '@bigcommerce/catalyst-client';
import { SubmissionResult } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { AuthError } from 'next-auth';
import { getLocale, getTranslations } from 'next-intl/server';

import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { TAGS } from '~/client/tags';
import { schema } from './schema';
import { revalidatePath } from 'next/cache';

/**
 * GraphQL mutations
 */
const AddCheckoutBillingMutation = graphql(`
  mutation addCheckoutBillingAddress($addCheckoutBillingAddressInput: AddCheckoutBillingAddressInput!) {
  checkout {
    addCheckoutBillingAddress(input: $addCheckoutBillingAddressInput) {
      checkout {
        entityId
      }
    }
  }
}  
`);

const AddCheckoutShippingMutation = graphql(`
    mutation addCheckoutShippingConsignments($addCheckoutShippingConsignmentsInput: AddCheckoutShippingConsignmentsInput!) {
    checkout {
        addCheckoutShippingConsignments(input: $addCheckoutShippingConsignmentsInput) {
            checkout {
                entityId
                shippingConsignments {
                    entityId
                    availableShippingOptions {
                        entityId
                    }
                    selectedShippingOption {
                        entityId
                    }
                }
            }
        }
    }
}`);

const SelectCheckoutShippingOptionMutation = graphql(`
  mutation selectCheckoutShippingOption($selectCheckoutShippingOptionInput: SelectCheckoutShippingOptionInput!) {
    checkout {
      selectCheckoutShippingOption(input: $selectCheckoutShippingOptionInput) {
        checkout {
          entityId
        }
      }
    }
  }
`);

const CompleteCheckoutMutation = graphql(`
  mutation completeCheckout($completeCheckoutInput: CompleteCheckoutInput!) {
    checkout {
      completeCheckout(input:$completeCheckoutInput) {
        orderEntityId
        paymentAccessToken
      }
    }
  }
`);

/**
 * Main payment flow
 */
export const saveShippingAddress = async (_lastResult: SubmissionResult | null, formData: FormData) =>
{
    const t = await getTranslations('Cart');

    const submission = parseWithZod(formData, { schema });
    console.log("Payment submission:", submission);

    if (submission.status !== 'success')
    {
        return submission.reply({ formErrors: ['Payment validation failed'] });
    }

    try
    {
        const { email, cartId, customerAccessToken, shippingFirstName, shippingLastName, shippingStreet, shippingCity, shippingState, shippingPostalCode, shippingCountry } = submission.value;

        const checkoutLineItems = JSON.parse(submission.value.checkoutLineItems);

        // STEP 1: Add shipping consignment
        const { data: shippingRes } = await client.fetch({
            document: AddCheckoutShippingMutation,
            variables: {
                addCheckoutShippingConsignmentsInput: {
                    checkoutEntityId: cartId,
                    data: {
                        consignments: [
                            {
                                address: {
                                    firstName: shippingFirstName,
                                    lastName: shippingLastName,
                                    email,
                                    address1: shippingStreet,
                                    address2: "",
                                    city: shippingCity,
                                    stateOrProvince: shippingState,
                                    postalCode: shippingPostalCode,
                                    countryCode: shippingCountry,
                                    shouldSaveAddress: true
                                },
                                "lineItems": checkoutLineItems
                            },
                        ],
                    }
                },
            },
            customerAccessToken,
            fetchOptions: { cache: 'no-store' }
        });

        const { checkout } = shippingRes;
        const { addCheckoutShippingConsignments } = checkout;
        // @ts-ignore
        const { checkout: checkout2 } = addCheckoutShippingConsignments;
        const { shippingConsignments } = checkout2;

        if (shippingConsignments && shippingConsignments.length > 0)
        {
            const { availableShippingOptions, entityId, selectedShippingOption } = shippingConsignments[0]
     
            const { data: selectShippingRes } = await client.fetch({
                document: SelectCheckoutShippingOptionMutation,
                variables: {
                    selectCheckoutShippingOptionInput: {
                        checkoutEntityId: cartId,
                        consignmentEntityId: entityId,
                        data: {
                            shippingOptionEntityId: availableShippingOptions[0]?.entityId
                        }
                    }
                }
            });
            console.log("Shipping option selection response:", selectShippingRes.checkout.selectCheckoutShippingOption!.checkout);
        }

        // STEP 2: Add billing address
        const { data: billingRes } = await client.fetch({
            document: AddCheckoutBillingMutation,
            variables: {
                addCheckoutBillingAddressInput: {
                    checkoutEntityId: cartId,
                    data: {
                        address: {
                            firstName: shippingFirstName,
                            lastName: shippingLastName,
                            email,
                            address1: shippingStreet,
                            address2: "",
                            city: shippingCity,
                            stateOrProvince: shippingState,
                            postalCode: shippingPostalCode,
                            countryCode: shippingCountry,
                            shouldSaveAddress: true
                        }
                    }
                }
            },
            // customerAccessToken,
            fetchOptions: { cache: 'no-store', next: { tags: [TAGS.cart, TAGS.checkout] } }
        });

        if (!billingRes.checkout?.addCheckoutBillingAddress?.checkout?.entityId)
        {
            throw new Error('Failed to add billing address');
        }
        
        const checkoutId = shippingRes.checkout?.addCheckoutShippingConsignments?.checkout?.entityId;
        if (!checkoutId) throw new Error('Failed to add shipping consignments');

        revalidatePath('/checkout');
        return submission.reply({ formErrors: [] }); // ✅ success
    } catch (error)
    {
        console.error("Checkout error:", error);

        if (error instanceof BigCommerceGQLError)
        {
            return submission.reply({ formErrors: error.errors.map(({ message }) => message) });
        }

        if (error instanceof AuthError)
        {
            return submission.reply({ formErrors: [t('Form.invalidCredentials')] });
        }

        return submission.reply({ formErrors: [t('Form.somethingWentWrong')] });
    }
};
