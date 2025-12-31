// product layout (drop-in)
// Add lazy Builder loader + lighter third-party script timing

import { clsx } from 'clsx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { PropsWithChildren } from 'react';
import Script from 'next/script';

import '../globals.css';

import { fonts } from '~/app/fonts';
import { client } from '~/client';
import { graphql } from '~/client/graphql';
import { DEFAULT_REVALIDATE_SECONDS } from '~/client/revalidate-target';
import { routing } from '~/i18n/routing';
import { SiteTheme } from '~/lib/makeswift/components/site-theme';
import { MakeswiftProvider } from '~/lib/makeswift/provider';

import { Notifications } from '../notifications';
import { Providers } from '../providers';

// Register ONLY what you need (but note: registering these still pulls Makeswift controls)
import '~/lib/makeswift/components/site-header/site-header.makeswift';
import '~/lib/makeswift/components/site-footer/site-footer.makeswift';
import '~/lib/makeswift/components/button-link/button-link.makeswift';

export const revalidate = 86400; // 24h cache hint for static parts

const RootLayoutMetadataQuery = graphql(`
  query RootLayoutMetadataQuery {
    site {
      settings {
        storeName
        seo {
          pageTitle
          metaDescription
          metaKeywords
        }
      }
    }
  }
`);

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await client.fetch({
    document: RootLayoutMetadataQuery,
    fetchOptions: { next: { revalidate: DEFAULT_REVALIDATE_SECONDS } },
  });

  const storeName = data.site.settings?.storeName ?? '';
  const { pageTitle, metaDescription, metaKeywords } = data.site.settings?.seo || {};

  return {
    title: {
      template: `%s - ${storeName}`,
      default: pageTitle || storeName,
    },
    icons: { icon: '/favicon.ico' },
    description: metaDescription,
    keywords: metaKeywords ? metaKeywords.split(',') : null,
    other: {
      platform: 'bigcommerce.catalyst',
      build_sha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? '',
    },
  };
}

interface Props extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

interface DocumentProps extends PropsWithChildren {
  locale: string;
  messages: Awaited<ReturnType<typeof getMessages>>;
}

function LayoutDocument({ locale, messages, children }: DocumentProps) {
  return (
    <html className={clsx(fonts.map((f) => f.variable))} lang={locale}>
      <head>
        <SiteTheme />

        {/* Apple Pay SDK must be ready on page load for payment availability */}
        <Script
          src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className="bg-asheraBackground">
        <Notifications />

        <NextIntlClientProvider locale={locale} messages={messages}>
          <NuqsAdapter>
            <Providers>{children}</Providers>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default async function RootLayout({ params, children }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) notFound();

  // Required by next-intl when statically rendering
  setRequestLocale(locale);

  const messages = await getMessages();

  // Preview/draft is disabled for now (no Makeswift editor support)
  return (
    <MakeswiftProvider previewMode={false}>
      <LayoutDocument locale={locale} messages={messages}>
        {children}
      </LayoutDocument>
    </MakeswiftProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const fetchCache = 'default-cache';
