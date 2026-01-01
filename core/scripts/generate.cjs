// @ts-check
const { generateSchema, generateOutput } = require('@gql.tada/cli-utils');
const { existsSync } = require('fs');
const { writeFile } = require('fs/promises');
const { join, resolve } = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const stubMode = process.env.CATALYST_STUB_MODE === 'true';

// Lazily hydrate environment variables from .env.local when running outside
// of stub mode so local developers don't need to remember to export
// every variable manually. Respect any values that are already present.
if (!stubMode) {
  const localEnvPath = resolve(__dirname, '../.env.local');

  if (existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: false });
  }
}

const graphqlApiDomain = process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com';

const getStoreHash = () => {
  const storeHash = process.env.BIGCOMMERCE_STORE_HASH;

  if (!storeHash) {
    throw new Error('Missing store hash');
  }

  return storeHash;
};

const getChannelId = () => {
  const channelId = process.env.BIGCOMMERCE_CHANNEL_ID;

  return channelId;
};

const getToken = () => {
  const token = process.env.BIGCOMMERCE_STOREFRONT_TOKEN;

  if (!token) {
    throw new Error('Missing storefront token');
  }

  return token;
};

const getEndpoint = () => {
  const storeHash = getStoreHash();
  const channelId = getChannelId();

  // Not all sites have the channel-specific canonical URL backfilled.
  // Wait till MSF-2643 is resolved before removing and simplifying the endpoint logic.
  if (!channelId || channelId === '1') {
    return `https://store-${storeHash}.${graphqlApiDomain}/graphql`;
  }

  return `https://store-${storeHash}-${channelId}.${graphqlApiDomain}/graphql`;
};

const buildConfigSchema = z.object({
  locales: z.array(
    z.object({
      code: z.string(),
      isDefault: z.boolean(),
    }),
  ),
  urls: z.object({
    vanityUrl: z.string(),
    checkoutUrl: z.string(),
    cdnUrls: z.array(z.string()),
  }),
});

const settingsQuery = /* GraphQL */ `
  query SettingsQuery {
    site {
      settings {
        url {
          vanityUrl
          cdnUrl
          checkoutUrl
        }
        locales {
          code
          isDefault
        }
      }
    }
  }
`;

async function writeBuildConfig() {
  if (stubMode) {
    const cdnEnvHostnames = process.env.NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME;
    const cdnUrls = cdnEnvHostnames
      ? cdnEnvHostnames.split(',').map((s) => s.trim())
      : ['cdn11.bigcommerce.com'];

    const payload = buildConfigSchema.parse({
      locales: [{ code: 'en', isDefault: true }],
      urls: {
        vanityUrl: 'http://localhost:3000',
        checkoutUrl: 'http://localhost:3000/checkout',
        cdnUrls,
      },
    });

    await writeFile(
      join(__dirname, '../build-config/build-config.json'),
      JSON.stringify(payload),
      'utf8',
    );
    return;
  }

  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      'User-Agent': 'ashera-catalyst-build-config',
    },
    body: JSON.stringify({ query: settingsQuery }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(`Failed to fetch settings: ${JSON.stringify(result.errors)}`);
  }

  const cdnEnvHostnames = process.env.NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME;
  const data = result.data?.site?.settings;

  const cdnUrls = (
    cdnEnvHostnames
      ? cdnEnvHostnames.split(',').map((s) => s.trim())
      : [data?.url?.cdnUrl]
  ).filter((url) => !!url);

  if (!cdnUrls.length) {
    throw new Error(
      'No CDN URLs found. Please ensure that NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME is set correctly.',
    );
  }

  const payload = buildConfigSchema.parse({
    locales: data?.locales ?? [],
    urls: {
      vanityUrl: data?.url?.vanityUrl ?? 'http://localhost:3000',
      checkoutUrl: data?.url?.checkoutUrl ?? 'http://localhost:3000/checkout',
      cdnUrls,
    },
  });

  await writeFile(
    join(__dirname, '../build-config/build-config.json'),
    JSON.stringify(payload),
    'utf8',
  );
}

const generate = async () => {
  try {
    if (stubMode) {
      // In stub mode, write stub build config and skip GraphQL generation
      await writeBuildConfig();
      // eslint-disable-next-line no-console
      console.log('[STUB MODE] Skipping GraphQL schema generation');
      return;
    }

    await generateSchema({
      input: getEndpoint(),
      headers: { Authorization: `Bearer ${getToken()}` },
      output: join(__dirname, '../bigcommerce.graphql'),
      tsconfig: undefined,
    });

    await generateOutput({
      disablePreprocessing: false,
      output: undefined,
      tsconfig: undefined,
    });

    await writeBuildConfig();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
};

generate();
