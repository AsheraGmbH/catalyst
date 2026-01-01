import { z } from 'zod';

export const schema = z.object({
  cartId: z.string().min(1, "Cart ID is required"),
  shippingFirstName: z.string().min(1, "First name is required"),
  shippingLastName: z.string().min(1, "Last name is required"),
  shippingStreet: z.string().min(1, "Street is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingPostalCode: z.string().min(5, "Postal code is required"),
  shippingCountry: z.string().min(2, "Country is required"),
  shippingState: z.string().min(2, "State is required"),
  customerAccessToken: z.string().min(1, "Customer access token is required"),
  email: z.string().min(5, "Email is required").email("Invalid email address"),
  checkoutLineItems: z.string().min(1, "Checkout line items are required"),
});
