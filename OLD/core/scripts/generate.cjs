// @ts-check
const { generateSchema, generateOutput } = require('@gql.tada/cli-utils');
const { existsSync } = require('fs');
const { writeFile } = require('fs/promises');
const { join, resolve } = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const graphqlApiDomain = process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com';
const useStubOutputs = process.env.CATALYST_STUB_MODE === 'true';

// Lazily hydrate environment variables from .env.local when running outside
// of the stubbed build so local developers don't need to remember to export
// every variable manually. Respect any values that are already present so we
// don't clobber deployment environments or the stub configuration.
if (!useStubOutputs) {
  const localEnvPath = resolve(__dirname, '../.env.local');

  if (existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: false });
  }
}

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

const generate = async () => {
  try {
    if (useStubOutputs) {
      await writeStubOutputs();
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

    await writeLocalesBuildConfig();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
};

const buildConfigSchema = z.object({
  locales: z
    .array(
      z.object({
        code: z.string(),
        isDefault: z.boolean(),
      }),
    )
    .default([]),
});

const localeQuery = /* GraphQL */ `
  query LocaleQuery {
    site {
      settings {
        locales {
          code
          isDefault
        }
      }
    }
  }
`;

async function writeLocalesBuildConfig() {
  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      'User-Agent': 'ashera-catalyst-build-config',
    },
    body: JSON.stringify({ query: localeQuery }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch locales: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(`Failed to fetch locales: ${JSON.stringify(result.errors)}`);
  }

  const payload = buildConfigSchema.parse({ locales: result.data?.site?.settings?.locales });
  await writeFile(
    join(__dirname, '../build-config/build-config.json'),
    JSON.stringify(payload),
    'utf8',
  );
}

async function writeStubOutputs() {
  const localesList =
    process.env.CATALYST_STUB_LOCALES?.split(',').map((locale) => locale.trim()).filter(Boolean) ??
    [];

  const locales = localesList.length
    ? localesList
    : ['en-US'];

  const payload = buildConfigSchema.parse({
    locales: locales.map((code, index) => ({ code, isDefault: index === 0 })),
  });

  await writeFile(
    join(__dirname, '../build-config/build-config.json'),
    JSON.stringify(payload),
    'utf8',
  );

  const stubSchema = `schema {\n  query: Query\n}\n\ntype Query {\n  _stub: String\n}`;
  await writeFile(join(__dirname, '../bigcommerce.graphql'), stubSchema, 'utf8');

  const stubTypes = `export type introspection = Record<string, never>;\n`;
  await writeFile(join(__dirname, '../bigcommerce-graphql.d.ts'), stubTypes, 'utf8');
}

generate();
