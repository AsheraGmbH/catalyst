import { ReactNode } from 'react';

import { Stream, Streamable } from '@/vibes/soul/lib/streamable';
import { Accordion, AccordionItem } from '@/vibes/soul/primitives/accordion';
import { AnimatedUnderline } from '@/vibes/soul/primitives/animated-underline';
import { Price, PriceLabel } from '@/vibes/soul/primitives/price-label';
import * as Skeleton from '@/vibes/soul/primitives/skeleton';
import { type Breadcrumb, Breadcrumbs } from '@/vibes/soul/sections/breadcrumbs';
import { ProductGallery } from '@/vibes/soul/sections/product-detail/product-gallery';
import { ReviewForm, SubmitReviewAction } from '@/vibes/soul/sections/reviews/review-form';
import { Image } from '~/components/image';
import BuilderIoPage from '~/lib/builder-io/BuilderIoPage';
import { BACKGROUND_IMAGE } from '~/lib/utils';

import {
  BackorderDisplayData,
  ProductDetailForm,
  ProductDetailFormAction,
  StockDisplayData,
} from './product-detail-form';
import { RatingLink } from './rating-link';
import { Field } from './schema';

interface ProductDetailProduct {
  id: string;
  title: string;
  href: string;
  images: Streamable<Array<{ src: string; alt: string }>>;
  price?: Streamable<Price | null>;
  subtitle?: string;
  badge?: string;
  rating?: Streamable<number | null>;
  reviewsEnabled?: boolean;
  showRating?: boolean;
  numberOfReviews?: number;
  summary?: Streamable<string>;
  description?: Streamable<string | ReactNode | null>;
  accordions?: Streamable<
    Array<{
      title: string;
      content: ReactNode;
    }>
  >;
  minQuantity?: Streamable<number | null>;
  maxQuantity?: Streamable<number | null>;
  stockDisplayData?: Streamable<StockDisplayData | null>;
  backorderDisplayData?: Streamable<BackorderDisplayData | null>;
}

export interface ProductDetailProps<F extends Field> {
  breadcrumbs?: Streamable<Breadcrumb[]>;
  product: Streamable<ProductDetailProduct | null>;
  action: ProductDetailFormAction<F>;
  fields: Streamable<F[]>;
  quantityLabel?: string;
  incrementLabel?: string;
  decrementLabel?: string;
  emptySelectPlaceholder?: string;
  ctaLabel?: Streamable<string | null>;
  ctaDisabled?: Streamable<boolean | null>;
  prefetch?: boolean;
  thumbnailLabel?: string;
  additionalInformationTitle?: string;
  additionalActions?: ReactNode;
  reviewFormEmailLabel?: string;
  reviewFormModalTitle?: string;
  reviewFormNameLabel?: string;
  reviewFormRatingLabel?: string;
  reviewFormReviewLabel?: string;
  reviewFormSubmitLabel?: string;
  reviewFormTitleLabel?: string;
  reviewFormAction: SubmitReviewAction;
  user: Streamable<{ email: string; name: string }>;
}

export const defaultBenefitsList: {
  title: string;
  icon: string;
}[] = [
  { title: '30-Day Money Back Guarantee', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736319/30_pcggcp.avif' },
  { title: 'Free Shipping', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736320/shipping_xnup5k.avif' },
  { title: '250 Trees Planted', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736320/tree_uom56y.avif' },
  { title: 'Sustainable Wood', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736320/sustainableleaf_aspjzv.avif' },
  { title: 'Handmade in Germany', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736320/madeingermany_h9tdfw.avif' },
  { title: '12 Month Rate Payment', icon: 'https://res.cloudinary.com/giftie/image/upload/v1756736320/pp_dmbamq.avif' },
];

// eslint-disable-next-line valid-jsdoc
/**
 * This component supports various CSS variables for theming. Here's a comprehensive list, along
 * with their default values:
 *
 * ```css
 * :root {
 *   --product-detail-border: hsl(var(--contrast-100));
 *   --product-detail-subtitle-font-family: var(--font-family-mono);
 *   --product-detail-title-font-family: var(--font-family-heading);
 *   --product-detail-primary-text: hsl(var(--foreground));
 *   --product-detail-secondary-text:  hsl(var(--contrast-500));
 * }
 * ```
 */
export function ProductDetail<F extends Field>({
  product: streamableProduct,
  action,
  fields: streamableFields,
  breadcrumbs,
  quantityLabel,
  incrementLabel,
  decrementLabel,
  emptySelectPlaceholder,
  ctaLabel: streamableCtaLabel,
  ctaDisabled: streamableCtaDisabled,
  prefetch,
  thumbnailLabel,
  additionalInformationTitle = 'Additional information',
  additionalActions,
  reviewFormEmailLabel,
  reviewFormModalTitle,
  reviewFormNameLabel,
  reviewFormRatingLabel,
  reviewFormReviewLabel,
  reviewFormSubmitLabel,
  reviewFormTitleLabel,
  reviewFormAction,
  user,
}: ProductDetailProps<F>) {
  return (
    <section
      style={{
        backgroundImage: `url(${BACKGROUND_IMAGE})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
      className="@container"
    >
      <div className="group/product-detail mx-auto w-full bg-transparent max-w-screen-2xl px-4 py-10 @xl:px-6 @xl:py-14 @4xl:px-8 @4xl:py-20">
        {breadcrumbs && (
          <div className="group/breadcrumbs mb-6">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        )}
        <Stream fallback={<ProductDetailSkeleton />} value={streamableProduct}>
          {(product) =>
            product && (
              <div className="grid grid-cols-1 items-stretch gap-x-8 gap-y-8 @2xl:grid-cols-2 @5xl:gap-x-12">
                <div className="group/product-gallery hidden @2xl:block">
                  <Stream fallback={<ProductGallerySkeleton />} value={product.images}>
                    {(images) => <ProductGallery images={images} />}
                  </Stream>
                </div>
                {/* Product Details */}
                <div className="text-foreground">
                  {Boolean(product.subtitle) && (
                    <p className="font-mono text-sm uppercase text-white">
                      {product.subtitle}
                    </p>
                  )}
                  <h1 className="text-white mb-3 mt-2 font-heading text-2xl font-medium leading-none @xl:mb-4 @xl:text-3xl @4xl:text-4xl">
                    {product.title}
                  </h1>
                  {product.reviewsEnabled && (
                    <div className="group/product-rating">
                      <ReviewForm
                        action={reviewFormAction}
                        formEmailLabel={reviewFormEmailLabel}
                        formModalTitle={reviewFormModalTitle}
                        formNameLabel={reviewFormNameLabel}
                        formRatingLabel={reviewFormRatingLabel}
                        formReviewLabel={reviewFormReviewLabel}
                        formSubmitLabel={reviewFormSubmitLabel}
                        formTitleLabel={reviewFormTitleLabel}
                        productId={Number(product.id)}
                        streamableImages={product.images}
                        streamableProduct={{ name: product.title }}
                        streamableUser={user}
                        trigger={
                          <AnimatedUnderline className="cursor-pointer">
                            Write a review
                          </AnimatedUnderline>
                        }
                      />
                    </div>
                  )}
                  {product.showRating && (
                    <div className="group/product-rating">
                      <Stream
                        fallback={<RatingSkeleton />}
                        value={Streamable.all([product.rating, product.numberOfReviews])}
                      >
                        {([rating, numberOfReviews]) => (
                          <RatingLink
                            numberOfReviews={numberOfReviews ?? 0}
                            rating={rating ?? 0}
                            scrollTargetId="reviews"
                          />
                        )}
                      </Stream>
                    </div>
                  )}
                  <div className="group/product-price">
                    <Stream fallback={<PriceLabelSkeleton />} value={product.price}>
                      {(price) => (
                        <PriceLabel className="my-3 text-white text-xl @xl:text-2xl" price={price ?? ''} />
                      )}
                    </Stream>
                  </div>
                  <div className="group/product-gallery mb-8 @2xl:hidden">
                    <Stream fallback={<ProductGallerySkeleton />} value={product.images}>
                      {(images) => (
                        <ProductGallery images={images} thumbnailLabel={thumbnailLabel} />
                      )}
                    </Stream>
                  </div>
                  <div className="group/product-summary">
                    <Stream fallback={<ProductSummarySkeleton />} value={product.summary}>
                      {(summary) =>
                        Boolean(summary) && (
                          <p className="text-[var(--product-detail-secondary-text,hsl(var(--contrast-500)))]">
                            {summary}
                          </p>
                        )
                      }
                    </Stream>
                  </div>
                  <div className="group/product-detail-form">
                    <Stream
                      fallback={<ProductDetailFormSkeleton />}
                      value={Streamable.all([
                        streamableFields,
                        streamableCtaLabel,
                        streamableCtaDisabled,
                        product.minQuantity,
                        product.maxQuantity,
                        product.stockDisplayData,
                        product.backorderDisplayData,
                      ])}
                    >
                      {([
                        fields,
                        ctaLabel,
                        ctaDisabled,
                        minQuantity,
                        maxQuantity,
                        stockDisplayData,
                        backorderDisplayData,
                      ]) => (
                        <ProductDetailForm
                          action={action}
                          additionalActions={additionalActions}
                          backorderDisplayData={backorderDisplayData ?? undefined}
                          ctaDisabled={ctaDisabled ?? undefined}
                          ctaLabel={ctaLabel ?? undefined}
                          decrementLabel={decrementLabel}
                          emptySelectPlaceholder={emptySelectPlaceholder}
                          fields={fields}
                          incrementLabel={incrementLabel}
                          maxQuantity={maxQuantity ?? undefined}
                          minQuantity={minQuantity ?? undefined}
                          prefetch={prefetch}
                          productId={product.id}
                          quantityLabel={quantityLabel}
                          stockDisplayData={stockDisplayData ?? undefined}
                        />
                      )}
                    </Stream>
                  </div>
                  <div className="group/product-description">
                    <Stream fallback={<ProductDescriptionSkeleton />} value={product.description}>
                      {(description) =>
                        Boolean(description) && (
                          <div className="border-t border-gray-600 pt-4 pb-6 text-white">
                            {/* shipping details */}
                            <div className="text-xs text-contrast-100 mb-4 mt-2 flex items-center">
                              <Image
                                src="https://res.cloudinary.com/giftie/image/upload/v1756736320/shipping_xnup5k.avif"
                                alt="Shipping"
                                width={24}
                                height={24}
                                sizes="24px"
                                className="inline w-6 h-6 mr-2"
                              />
                              Crafted just for you over 4 - 6 weeks, with personal updates.
                            </div>
                            {description}
                          </div>
                        )
                      }
                    </Stream>
                  </div>
                  <h2 className="sr-only">{additionalInformationTitle}</h2>
                  <div className="group/product-accordion">
                    <Stream fallback={<ProductAccordionsSkeleton />} value={product.accordions}>
                      {(accordions) =>
                        accordions && (
                          <Accordion
                            className="border-t border-gray-600 pt-4"
                            type="multiple"
                          >
                            {accordions.map((accordion, index) => (
                              <AccordionItem
                                key={index}
                                title={accordion.title}
                                value={index.toString()}
                                colorScheme="dark"
                              >
                                {accordion.content}
                              </AccordionItem>
                            ))}
                          </Accordion>
                        )
                      }
                    </Stream>
                  </div>
                </div>
              </div>
            )
          }
        </Stream>
      </div>

      <div className="flex flex-col md:flex-row lg:flex-row py-4 -mt-4 lg:mt-0 lg:mx-auto gap-4 lg:gap-8 overflow-x-scroll items-center justify-start lg:bg-[#1B1B1B] @container px-4 @xl:px-6 @4xl:px-8 scroll-container no-scrollbar">
        {defaultBenefitsList.map((benefits, index) => (
          <div
            className={`flex items-center gap-4 lg:gap-2 relative ${index === 0 ? 'lg:ml-auto' : ''} ${index === defaultBenefitsList.length - 1 ? 'mr-auto lg:mr-auto' : 'mr-auto md:mr-px lg:mr-px'}`}
            key={index}
          >
            <Image
              alt={benefits.title}
              width={24}
              height={24}
              sizes="24px"
              className="w-6 h-6"
              src={benefits.icon}
            />
            <p className="text-background text-sm">{benefits.title}</p>
          </div>
        ))}
      </div>

      <Stream fallback={<ProductDetailSkeleton />} value={streamableProduct}>
        {(product) => <BuilderIoPage id={product?.id} />}
      </Stream>
    </section>
  );
}

function ProductGallerySkeleton() {
  return (
    <Skeleton.Root className="group-has-[[data-pending]]/product-gallery:animate-pulse" pending>
      <div className="w-full overflow-hidden rounded-xl @xl:rounded-2xl">
        <div className="flex">
          <Skeleton.Box className="aspect-[4/5] h-full w-full shrink-0 grow-0 basis-full" />
        </div>
      </div>
      <div className="mt-2 flex max-w-full gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton.Box className="h-12 w-12 shrink-0 rounded-lg @md:h-16 @md:w-16" key={idx} />
        ))}
      </div>
    </Skeleton.Root>
  );
}

function PriceLabelSkeleton() {
  return <Skeleton.Box className="my-5 h-4 w-20 rounded-md" />;
}

function RatingSkeleton() {
  return (
    <Skeleton.Root
      className="flex w-[136px] items-center gap-1 group-has-[[data-pending]]/product-rating:animate-pulse"
      pending
    >
      <Skeleton.Box className="h-4 w-[100px] rounded-md" />
      <Skeleton.Box className="h-6 w-8 rounded-xl" />
    </Skeleton.Root>
  );
}

function ProductSummarySkeleton() {
  return (
    <Skeleton.Root
      className="flex w-full flex-col gap-3.5 pb-6 group-has-[[data-pending]]/product-summary:animate-pulse"
      pending
    >
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton.Box className="h-2.5 w-full" key={idx} />
      ))}
    </Skeleton.Root>
  );
}

function ProductDescriptionSkeleton() {
  return (
    <Skeleton.Root
      className="flex w-full flex-col gap-3.5 pb-6 group-has-[[data-pending]]/product-description:animate-pulse"
      pending
    >
      {Array.from({ length: 2 }).map((_, idx) => (
        <Skeleton.Box className="h-2.5 w-full" key={idx} />
      ))}
      <Skeleton.Box className="h-2.5 w-3/4" />
    </Skeleton.Root>
  );
}

function ProductDetailFormSkeleton() {
  return (
    <Skeleton.Root
      className="flex flex-col gap-8 py-8 group-has-[[data-pending]]/product-detail-form:animate-pulse"
      pending
    >
      <div className="flex flex-col gap-5">
        <Skeleton.Box className="h-2 w-10 rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton.Box className="h-11 w-[72px] rounded-full" key={idx} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton.Box className="h-3 w-16 rounded-md" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton.Box className="h-10 w-10 rounded-full" key={idx} />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton.Box className="h-12 w-[120px] rounded-lg" />
        <Skeleton.Box className="h-12 w-[216px] rounded-full" />
      </div>
    </Skeleton.Root>
  );
}

function ProductAccordionsSkeleton() {
  return (
    <Skeleton.Root
      className="flex h-[600px] w-full flex-col gap-8 pt-4 group-has-[[data-pending]]/product-accordion:animate-pulse"
      pending
    >
      <div className="flex items-center justify-between">
        <Skeleton.Box className="h-2 w-20 rounded-sm" />
        <Skeleton.Box className="h-3 w-3 rounded-sm" />
      </div>
      <div className="mb-1 flex flex-col gap-4">
        <Skeleton.Box className="h-3 w-full rounded-sm" />
        <Skeleton.Box className="h-3 w-full rounded-sm" />
        <Skeleton.Box className="h-3 w-3/5 rounded-sm" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton.Box className="h-2 w-24 rounded-sm" />
        <Skeleton.Box className="h-3 w-3 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton.Box className="h-2 w-20 rounded-sm" />
        <Skeleton.Box className="h-3 w-3 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton.Box className="h-2 w-32 rounded-sm" />
        <Skeleton.Box className="h-3 w-3 rounded-full" />
      </div>
    </Skeleton.Root>
  );
}

export function ProductDetailSkeleton() {
  return (
    <Skeleton.Root
      className="grid grid-cols-1 items-stretch gap-x-6 gap-y-8 group-has-[[data-pending]]/product-detail:animate-pulse @2xl:grid-cols-2 @5xl:gap-x-12"
      pending
    >
      <div className="hidden @2xl:block">
        <ProductGallerySkeleton />
      </div>
      <div>
        <Skeleton.Box className="mb-6 h-4 w-20 rounded-lg" />
        <Skeleton.Box className="mb-6 h-6 w-72 rounded-lg" />
        <RatingSkeleton />
        <PriceLabelSkeleton />
        <ProductSummarySkeleton />
        <div className="mb-8 @2xl:hidden">
          <ProductGallerySkeleton />
        </div>
        <ProductDetailFormSkeleton />
      </div>
    </Skeleton.Root>
  );
}
