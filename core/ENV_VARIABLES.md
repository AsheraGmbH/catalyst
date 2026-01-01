# Environment Variables Documentation

This document lists all required and optional environment variables for the Catalyst application.

## Required for Build

These variables are needed during the build process:

```bash
BIGCOMMERCE_STOREFRONT_TOKEN=        # BigCommerce Storefront API token
BIGCOMMERCE_STORE_HASH=              # BigCommerce store hash
BIGCOMMERCE_CHANNEL_ID=              # BigCommerce channel ID (or use NEXT_PUBLIC_BIGCOMMERCE_CHANNEL_ID)
NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME= # BigCommerce CDN hostname (e.g., cdn11.bigcommerce.com)
```

## Required for Runtime (Checkout)

These variables are needed for the checkout functionality:

```bash
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=        # PayPal client ID (public)
PAYPAL_CLIENT_SECRET=                # PayPal client secret (server-side only)
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=      # PayPal environment: "sandbox" or "production"

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=     # Google Maps API key for address autocomplete

# BigCommerce API
BIGCOMMERCE_ACCESS_TOKEN=            # BigCommerce API access token for order creation

# Security
ORDER_ENCRYPTION_KEY=                # Secret key for encrypting/decrypting order data (thank-you page)
```

## Optional (Analytics)

These variables are optional and used for analytics:

```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=     # Google Analytics tracking ID
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=  # Google Tag Manager container ID
```

## Optional (Configuration)

These variables are optional and have defaults:

```bash
# Next.js Configuration
TRAILING_SLASH=true                  # Set to 'false' to disable trailing slashes in URLs

# Development/CI
CI=false                             # Set to 'true' to ignore TypeScript errors during build (CI only)
CLIENT_LOGGER=false                  # Set to 'true' to enable client-side logging
NODE_ENV=production                  # Environment: development, production, or test

# Vercel (auto-set in Vercel deployments)
NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=  # Git commit SHA (auto-set by Vercel)
VERCEL=1                             # Set to '1' when deployed on Vercel
DISABLE_VERCEL_ANALYTICS=false       # Set to 'true' to disable Vercel Analytics
DISABLE_VERCEL_SPEED_INSIGHTS=false # Set to 'true' to disable Vercel Speed Insights
```

## Example .env.local

Create a `.env.local` file in the `core/` directory with the following structure:

```bash
# BigCommerce
BIGCOMMERCE_STOREFRONT_TOKEN=your_storefront_token_here
BIGCOMMERCE_STORE_HASH=your_store_hash_here
BIGCOMMERCE_CHANNEL_ID=1
NEXT_PUBLIC_BIGCOMMERCE_CHANNEL_ID=1
NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME=cdn11.bigcommerce.com

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=sandbox

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Security
ORDER_ENCRYPTION_KEY=your_encryption_key_here

# BigCommerce API
BIGCOMMERCE_ACCESS_TOKEN=your_access_token_here

# Analytics (Optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=
```

## Notes

- Never commit `.env.local` to version control
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Server-side only variables (without `NEXT_PUBLIC_`) are secure and not exposed to the client
- The `ORDER_ENCRYPTION_KEY` should be a strong, random string (at least 32 characters)
- PayPal environment should be set to `sandbox` for testing and `production` for live deployments
