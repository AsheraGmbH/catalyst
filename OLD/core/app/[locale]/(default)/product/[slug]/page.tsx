import { removeEdgesAndNodes } from '@bigcommerce/catalyst-client';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

import { Stream, Streamable } from '@/vibes/soul/lib/streamable';
import { getSessionCustomerAccessToken } from '~/auth';
import { pricesTransformer } from '~/data-transformers/prices-transformer';
import { productOptionsTransformer } from '~/data-transformers/product-options-transformer';
import { getPreferredCurrencyCode } from '~/lib/currency';
const ProductDetail = dynamic(
  () => import('~/lib/makeswift/components/product-detail').then((m) => m.ProductDetail),
  { ssr: true },
);

import { addToCart, addToCartAndRedirect } from './_actions/add-to-cart';
import { ProductSchema } from './_components/product-schema';
import { ProductViewed } from './_components/product-viewed';
import { PaginationSearchParamNames } from './_components/reviews';
import {
  getProduct,
  getProductPageMetadata,
  getProductPricingAndRelatedProducts,
  getStreamableProduct,
} from './page-data';
import BuilderIoRenderedHTMLString from '~/lib/makeswift/components/product-detail/BuilderIoRenderedHTMLString';
import { determineImageFilename, getAvailableImages, getImageDataUri } from './helpers';
export const revalidate = 10800;

const Reviews = dynamic(() => import('./_components/reviews').then((m) => m.Reviews), {
  loading: () => null,
});

const accordionDescriptions = [
  {
    id: 'philosophy',
    desc: 'The Aeon isn’t simply a pen — it is a statement of permanence in a world of disposability. Every stroke is a reminder to slow down, to anchor yourself in the present, and to let your words carry weight.',
  },
  {
    id: 'craftRarity',
    desc: 'Each Aeon undergoes an eight-layer lacquering process, inspired by Japanese Urushi but using the most resilient modern lacquer in existence. Every layer is applied and hardened individually, a ritual that takes weeks. Only two artisans, Marius and Salvatore, can achieve this flawless finish, which limits production to just a handful each month. This rarity is why the Aeon is capped at 999 pieces worldwide — once complete, there will never be more.',
  },
  {
    id: 'personalizationAndBespoke',
    desc: 'Your Aeon begins with a choice of wood and the option of engraving. But that is only the beginning. We can craft boxes from exotic woods, create one-of-a-kind engravings or inlays, or even design a unique pen from the ground up for you. This is not mass-produced luxury; it is an heirloom tailored to your hand, your story, and your legacy.',
  },
  {
    id: 'careAndMaterials',
    desc: 'The Aeon is designed to outlast you. Its stabilized wood is pressure-infused for centuries of durability; its lacquer shrugs off daily wear and even minor impacts. Each pen comes with a handmade walnut box that doubles as a minimalist pen rest. And if anything ever falters, our lifetime warranty on manufacturing defects ensures it will be repaired or replaced. Care is simple: avoid submerging in water, clean with a cloth, and the pen will age gracefully, alongside you.',
  },
  {
    id: 'climatePledge',
    desc: 'The Ashera mission is to create a more meaningful and beautiful world for all. That’s why we plant 250 trees for every pen. As these trees mature, they will likely offset several years of your carbon emissions. Depending on the pen you select, planting you a small forest costs us ~5-10% of our revenue. Unlike many others who pledge only 1% or less, we are a truly mission driven team seeking better the world. Trees are the lungs of the earth - and the guardians of most biomes of animals and plants. If they thrive, so does the Earth and so do we.',
  },
  {
    id: 'designedForFlow',
    desc: 'The Phi is engineered to disappear in your hand, letting ideas flow without friction. Its twist mechanism opens and closes with a single smooth rotation — intuitive, precise, and inevitable. Write whenever inspiration strikes, without distraction.',
  },
  {
    id: 'strengthInSimplicity',
    desc: 'Every detail is overengineered to last centuries, not years. The grip is solid titanium, the body is stabilized wood strengthened under vacuum and pressure, and the bearings are planar composites common in aerospace and never used in pens previously. Springs, steel, and modular construction mean the Phi is a tool built for permanence.',
  },
  {
    id: 'yourChoiceYourTool',
    desc: 'The Phi adapts to you. Available as ballpoint, gel, or mechanical pencil, each comes with our finest German-made cartridge or preloaded 0.5mm HB leads. When it runs out, you’re never stranded: the Phi accepts standard refills from any stationery store. And because every part is threaded or pressure-fit, it can be repaired, upgraded, or renewed endlessly.',
  },
  {
    id: 'heirloomGuarantee',
    desc: 'Every Phi is accompanied by a handmade walnut box and protected by our lifetime warranty on manufacturing defects. If a spring, grip, or mechanism ever fails, we will repair or replace it. What you begin with today is meant to stay with you for life. Care is simple: avoid water, store safely, and let the materials age with dignity.',
  },
  {
    id: 'aLivingSurface',
    desc: 'The Oleatus feels alive in your hand. Its oiled finish draws out the wood’s natural grain, giving warmth and texture while protecting it from water, grease, and daily handling. This is a pen meant to be touched and lived with.',
  },
  {
    id: 'precisionWriting',
    desc: 'Every nib — whether in 14k gold, 950 platinum, or stainless steel — is individually polished and tuned for exceptional smoothness. Each tip is crowned with iridium, one of the hardest, rarest metals on Earth, chosen for its glide and longevity. Writing with the Oleatus isn’t just about ink on paper; it is about elevating the act of writing itself.',
  },
  {
    id: 'personalTouch',
    desc: 'The Oleatus is made for personalization. Choose your wood, engrave a name or message, or request a bespoke walnut box. We can even incorporate symbols, inlays, or fully unique designs to reflect your personal journey.',
  },
  {
    id: 'lifetimeAssurance',
    desc: 'Every Oleatus is accompanied by a beautiful handmade walnut wood box carries a lifetime warranty on manufacturing defects. Stabilized and oil-treated under pressure, the wood is as resilient as it is beautiful, resistant to moisture and daily wear. If an accident occurs, we are here to restore it — so your pen remains a permanent companion.',
  },
];

const getProductImageFromStorageGit = async (variables: {
  entityId: number;
  optionValueIds: Array<{ optionEntityId: number; valueEntityId: number }>;
  useDefaultOptionSelections: boolean;
}) => {
  const { images, path } = getAvailableImages(variables.entityId);

  if (path === '') return false;

  const imageFilename = determineImageFilename(variables, images);
  const imagePath = `/${variables.entityId}/${imageFilename}`;
  const imageDataUri = getImageDataUri(path, imagePath);

  return imageDataUri;
};

const cachedProductVariables = cache(
  async (
    productId: string,
    searchParamsPromise: Props['searchParams'],
  ): Promise<{
    entityId: number;
    optionValueIds: Array<{ optionEntityId: number; valueEntityId: number }>;
    useDefaultOptionSelections: boolean;
  }> => {
    const options = await searchParamsPromise;
    const optionValueIds = Object.keys(options)
      .map((option) => ({
        optionEntityId: Number(option),
        valueEntityId: Number(options[option]),
      }))
      .filter(
        (option) => !Number.isNaN(option.optionEntityId) && !Number.isNaN(option.valueEntityId),
      );

    return {
      entityId: Number(productId),
      optionValueIds,
      useDefaultOptionSelections: true,
    };
  },
);

const searchParamsCache = createSearchParamsCache({
  [PaginationSearchParamNames.BEFORE]: parseAsString,
  [PaginationSearchParamNames.AFTER]: parseAsString,
});

interface Props {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const customerAccessToken = await getSessionCustomerAccessToken();
  const product = await getProductPageMetadata(Number(slug), customerAccessToken);

  if (!product) {
    return notFound();
  }

  const { pageTitle, metaDescription, metaKeywords } = product.seo;
  const { url, altText: alt } = product.defaultImage || {};

  return {
    title: pageTitle || product.name,
    description: metaDescription || `${product.plainTextDescription.slice(0, 150)}...`,
    keywords: metaKeywords ? metaKeywords.split(',') : null,
    openGraph: url
      ? {
          images: [
            {
              url,
              alt,
            },
          ],
        }
      : null,
  };
}

export default async function Product(props: Props) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const customerAccessToken = await getSessionCustomerAccessToken();
  const t = await getTranslations('Product');
  const tAcc = await getTranslations('Product.ProductDetails.Accordions');
  const format = await getFormatter();

  const productId = Number(slug);
  const baseProduct = await getProduct(productId, customerAccessToken);

  if (!baseProduct) {
    return notFound();
  }

  const parsedSearchParams = searchParamsCache.parse(props.searchParams);
  const baseVariablesPromise = cachedProductVariables(slug, props.searchParams);
  const preferredCurrencyPromise = getPreferredCurrencyCode();

  const resolveVariablesWithCurrency = async () => {
    const baseVariables = await baseVariablesPromise;
    const currencyCode = (await preferredCurrencyPromise) ?? 'USD';

    return { ...baseVariables, currencyCode };
  };

  const streamableProduct = Streamable.from(async () => {
    const product = await getStreamableProduct(
      await resolveVariablesWithCurrency(),
      customerAccessToken,
    );

    if (!product) {
      return notFound();
    }

    return product;
  });

  const streamableProductPricingAndRelatedProducts = Streamable.from(async () =>
    getProductPricingAndRelatedProducts(await resolveVariablesWithCurrency(), customerAccessToken),
  );

  const streamableProductSku = Streamable.from(async () => (await streamableProduct).sku);

  const streamablePrices = Streamable.from(async () => {
    const product = await streamableProductPricingAndRelatedProducts;

    if (!product?.prices) {
      return null;
    }

    return pricesTransformer(product.prices, format) ?? null;
  });

  const streamableImages = Streamable.from(async () => {
    const product = await streamableProduct;

    let images = removeEdgesAndNodes(product.images)
      .filter((image) => image.url !== product.defaultImage?.url)
      .map((image) => ({
        src: image.url,
        alt: image.altText,
      }));

    if (product.defaultImage) {
      images = [{ src: product.defaultImage.url, alt: product.defaultImage.altText }, ...images];
    }

    if (product.defaultImage?.url.includes('source_0')) {
      const { entityId, optionValueIds, useDefaultOptionSelections } =
        await resolveVariablesWithCurrency();
      const image = await getProductImageFromStorageGit({
        entityId,
        optionValueIds,
        useDefaultOptionSelections,
      });

      if (image) {
        images = [{ src: image, alt: `${product.name} image` }, ...images.slice(1)];
      }
    }

    return images;
  });

  const streamableCtaLabel = Streamable.from(async () => {
    const product = await streamableProduct;

    if (product.availabilityV2.status === 'Unavailable') {
      return t('ProductDetails.Submit.unavailable');
    }

    if (product.availabilityV2.status === 'Preorder') {
      return t('ProductDetails.Submit.preorder');
    }

    if (!product.inventory.isInStock) {
      return t('ProductDetails.Submit.outOfStock');
    }

    return t('ProductDetails.Submit.addToCart');
  });

  const streamableCtaDisabled = Streamable.from(async () => {
    const product = await streamableProduct;

    if (product.availabilityV2.status === 'Unavailable') {
      return true;
    }

    if (product.availabilityV2.status === 'Preorder') {
      return false;
    }

    if (!product.inventory.isInStock) {
      return true;
    }

    return false;
  });

  const streamableAccordions = Streamable.from(async () => {
    const product = await streamableProduct;
    const customFields = removeEdgesAndNodes(product.customFields);

    const specifications = [
      { name: tAcc('weight'), value: `${product.weight?.value} ${product.weight?.unit}` },
      ...customFields.map((field) => ({ name: field.name, value: field.value })),
    ];

    const tabSpecifications = specifications.filter((field) => field.name.startsWith('Tab:'));
    const cleanedTabSpecifications = tabSpecifications.map((field) => ({
      ...field,
      name: field.name.replace('Tab:', '').trim(),
    }));
    const otherSpecifications = specifications.filter((field) => !field.name.startsWith('Tab:'));

    return [
      ...(otherSpecifications.length
        ? [
            {
              title: tAcc('specifications'),
              content: (
                <div className="prose @container">
                  <dl className="flex flex-col gap-4">
                    {otherSpecifications.map((field, index) => (
                      <div className="grid grid-cols-1 gap-2 @lg:grid-cols-2" key={index}>
                        <dt>
                          <strong>{field.name}</strong>
                        </dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ),
            },
          ]
        : []),
      ...cleanedTabSpecifications.map((field) => ({
        title: field.name,
        content: (
          <div className="prose">
            {accordionDescriptions.map((desc) => (desc.id === field.value ? desc.desc : null))}
          </div>
        ),
      })),
      ...(product.warranty
        ? [
            {
              title: tAcc('warranty'),
              content: (
                <div className="prose" dangerouslySetInnerHTML={{ __html: product.warranty }} />
              ),
            },
          ]
        : []),
    ];
  });

  const streamableProductDetail = Streamable.from(async () => {
    const [product, pricingProduct] = await Streamable.all([
      streamableProduct,
      streamableProductPricingAndRelatedProducts,
    ]);

    if (!product) {
      return null;
    }

    const variantNodes = pricingProduct?.variants
      ? removeEdgesAndNodes(pricingProduct.variants)
      : [];

    let defaultPrice = 0;
    let currencyCode = '';
    const variantPrices: Record<string, number> = {};

    if (variantNodes.length > 0) {
      const firstVariantPrice = variantNodes[0]?.prices?.price;

      if (firstVariantPrice) {
        defaultPrice = firstVariantPrice.value ?? 0;
        currencyCode = firstVariantPrice.currencyCode ?? '';
      }

      variantNodes.forEach((variant) => {
        const priceValue = variant.prices?.price?.value;

        if (variant.sku && typeof priceValue === 'number') {
          variantPrices[variant.sku] = priceValue;
        }
      });
    } else if (pricingProduct?.prices?.price?.value != null) {
      defaultPrice = pricingProduct.prices.price.value;
      currencyCode = pricingProduct.prices.price.currencyCode ?? '';
    }

    return {
      id: baseProduct.entityId.toString(),
      defaultPrice,
      variantPrices,
      currencyCode,
      title: baseProduct.name,
      description: <div className="prose" dangerouslySetInnerHTML={{ __html: baseProduct.description }} />,
      href: baseProduct.path,
      images: streamableImages,
      price: streamablePrices,
      subtitle: baseProduct.brand?.name,
      rating: baseProduct.reviewSummary.averageRating,
      accordions: streamableAccordions,
    };
  });

  return (
    <>
      <Suspense fallback={null}>
        <BuilderIoRenderedHTMLString slug={slug} />
      </Suspense>

      <ProductDetail
        action={addToCart}
        checkoutAction={addToCartAndRedirect}
        additionalInformationLabel={t('ProductDetails.additionalInformation')}
        ctaDisabled={streamableCtaDisabled}
        ctaLabel={streamableCtaLabel}
        decrementLabel={t('ProductDetails.decreaseQuantity')}
        fields={productOptionsTransformer(baseProduct.productOptions)}
        incrementLabel={t('ProductDetails.increaseQuantity')}
        prefetch={true}
        product={streamableProductDetail}
        productId={productId}
        quantityLabel={t('ProductDetails.quantity')}
        thumbnailLabel={t('ProductDetails.thumbnail')}
      />

      <Reviews productId={productId} searchParams={parsedSearchParams} />

      <Stream fallback={null} value={streamableProduct}>
        {(product) => {
          const urls = [
            ...(product.defaultImage?.url ? [product.defaultImage.url] : []),
            ...removeEdgesAndNodes(product.images).map((img) => img.url),
          ].filter(Boolean);
          const unique = Array.from(new Set(urls));

          const script = `
            (function(){
              try {
                var urls = ${JSON.stringify(unique)};
                if (!Array.isArray(urls) || !urls.length) return;
                var nav = (navigator||{});
                if (nav.connection && nav.connection.saveData) return;

                function start(){
                  var queue = urls.slice(1);
                  var i = 0, active = 0, MAX = 2;
                  function kick(){
                    while(active < MAX && i < queue.length){
                      var u = queue[i++]; active++;
                      var img = new Image();
                      try { img.fetchPriority = 'low'; } catch(e){}
                      img.decoding = 'async';
                      img.loading = 'eager';
                      img.referrerPolicy = 'no-referrer';
                      var done = function(){ active--; setTimeout(kick, 120); };
                      img.onload = done; img.onerror = done;
                      img.src = u;
                    }
                  }
                  kick();
                }

                function runIdle(){
                  if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(start, { timeout: 2000 });
                  } else {
                    setTimeout(start, 800);
                  }
                }

                if (document.readyState === 'complete') runIdle();
                else window.addEventListener('load', runIdle, { once: true });
              } catch (e) {}
            })();
          `;

          return <script dangerouslySetInnerHTML={{ __html: script }} />;
        }}
      </Stream>

      <Stream
        fallback={null}
        value={Streamable.from(async () =>
          Streamable.all([streamableProduct, streamableProductPricingAndRelatedProducts]),
        )}
      >
        {([extendedProduct, pricingProduct]) => (
          <>
            <ProductSchema
              product={{ ...extendedProduct, prices: pricingProduct?.prices ?? null }}
            />
            <ProductViewed
              product={{ ...extendedProduct, prices: pricingProduct?.prices ?? null }}
            />
          </>
        )}
      </Stream>
    </>
  );
}
