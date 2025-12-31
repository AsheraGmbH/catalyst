'use client';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import NextImage, { ImageProps } from 'next/image';

import bcCdnImageLoader from '~/lib/cdn-image-loader';

const cdnHostname = process.env.NEXT_PUBLIC_BIGCOMMERCE_CDN_HOSTNAME ?? 'cdn11.bigcommerce.com';

function shouldUseLoaderProp(props: ImageProps): boolean {
  return typeof props.src === 'string' && props.src.startsWith(`https://${cdnHostname}`);
}

/**
 * This component should be used in place of Next's `Image` component for images from the
 * BigCommerce platform, which will reduce load on the Next.js application for image assets.
 *
 * It defaults to use the default loader in Next.js if it's an image not from the BigCommerce CDN.
 *
 * @returns {React.ReactElement} The `<Image>` component
 */
export const Image = (props: ImageProps) => {
  // const loader = shouldUseLoaderProp(props) ? bcCdnImageLoader : undefined;
  // Separate the src because we may replace it
  const { src, width, ...rest } = props;
  if(shouldUseLoaderProp(props)) {
    const url = bcCdnImageLoader({
      src: props.src as string,
      width: props.width ? +props.width : 1500
    });
    // remove src from props
    const { src, ...rest } = props;
    return <NextImage src={url} quality={70} {...rest} />;
  }

  return <NextImage layout="fixed" quality={70} {...props} />;
};
