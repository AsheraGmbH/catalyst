// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cspHeader } from './lib/content-security-policy.ts';

const currentDir = fileURLToPath(new URL('.', import.meta.url));
const stubMode = process.env.CATALYST_STUB_MODE === 'true';

if (stubMode) {
  process.env.NEXT_PRIVATE_DISABLE_FONT_DOWNLOADS = 'true';
}

const withNextIntl = createNextIntlPlugin();

export default async (): Promise<NextConfig> => {
  let withMakeswift: (config: NextConfig) => NextConfig | Promise<NextConfig> = (config) => config;

  if (!stubMode) {
    const { default: createWithMakeswift } = await import('@makeswift/runtime/next/plugin');
    withMakeswift = createWithMakeswift({ previewMode: false });
  }

  let nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,

    images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
        { protocol: 'https', hostname: 'cdn11.bigcommerce.com', pathname: '/**' },
        { protocol: 'https', hostname: 'cdn.makeswift.com', pathname: '/**' },
        { protocol: 'https', hostname: 'cdn.builder.io', pathname: '/**' },
        { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      ],
      minimumCacheTTL: 86400, // 1 day
    },

    experimental: {
      optimizePackageImports: [
        '@icons-pack/react-simple-icons',
        'lodash',
        'date-fns',
        'lucide-react',
        '@radix-ui/react-accordion',
        '@radix-ui/react-select',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-navigation-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-portal',
        '@radix-ui/react-label',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-toggle-group',
      ],
    },

    compiler: {
      // Apply removeConsole only in production
      removeConsole:
        process.env.NODE_ENV === 'production'
          ? { exclude: ['error', 'warn'] }
          : false,
    },

    modularizeImports: {
      lodash: { transform: 'lodash/{{member}}' },
    },


    transpilePackages: ['@mep-agency/next-iubenda'],
    typescript: { ignoreBuildErrors: !!process.env.CI },
    eslint: { ignoreDuringBuilds: !!process.env.CI, dirs: ['app','client','components','lib','middlewares'] },
    trailingSlash: process.env.TRAILING_SLASH !== 'false',

    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: cspHeader.replace(/\n/g, ''),
            },
            {
              key: 'Link',
              value: `<https://${process.env.NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME ?? 'cdn11.bigcommerce.com'}>; rel=preconnect`,
            },
          ],
        },
      ];
    },

    webpack: (config, options) => {
      config.plugins.push(
        new options.webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
      );
      if (stubMode) {
        config.resolve = config.resolve ?? {};
        config.resolve.alias = {
          ...(config.resolve.alias ?? {}),
          '@makeswift/runtime/next$': join(currentDir, './lib/makeswift/runtime-next.stub.ts'),
          '@makeswift/runtime/next/server$': join(
            currentDir,
            './lib/makeswift/runtime-next-server.stub.ts',
          ),
          '@makeswift/runtime$': join(currentDir, './lib/makeswift/runtime.stub.ts'),
          '~/lib/makeswift/runtime$': join(currentDir, './lib/makeswift/runtime.local.stub.ts'),
          '~/lib/makeswift/components$': join(currentDir, './lib/makeswift/components.stub.ts'),
        };
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /^~\/app\/fonts$/,
            join(currentDir, './app/fonts.stub.ts'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /^~\/lib\/makeswift$/,
            join(currentDir, './lib/makeswift/index.stub.ts'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /^~\/lib\/makeswift\/provider$/,
            join(currentDir, './lib/makeswift/provider.stub.tsx'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /^~\/app\/\[locale\]\/layout$/,
            join(currentDir, './app/[locale]/layout.stub.tsx'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /app\/\[locale\]\/layout\.tsx$/,
            join(currentDir, './app/[locale]/layout.stub.tsx'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /app\/global-error\.tsx$/,
            join(currentDir, './app/global-error.stub.tsx'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /app\/robots\.txt\/route\.ts$/,
            join(currentDir, './app/robots.txt/route.stub.ts'),
          ),
        );
        config.plugins.push(
          new options.webpack.NormalModuleReplacementPlugin(
            /app\/favicon\.ico\/route\.ts$/,
            join(currentDir, './app/favicon.ico/route.stub.ts'),
          ),
        );
      }
      return config;
    },
  };

  // Apply plugins (order preserved)
  nextConfig = withNextIntl(nextConfig);
  nextConfig = await withMakeswift(nextConfig);

  if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = bundleAnalyzer();
    nextConfig = withBundleAnalyzer(nextConfig);
  }

  return nextConfig;
};
