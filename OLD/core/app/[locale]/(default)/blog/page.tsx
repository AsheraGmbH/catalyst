import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SearchParams } from 'nuqs';
import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server';

import { Streamable } from '@/vibes/soul/lib/streamable';
import { FeaturedBlogPostList } from '@/vibes/soul/sections/featured-blog-post-list';
import { defaultPageInfo, pageInfoTransformer } from '~/data-transformers/page-info-transformer';

import { getBlog, getBlogPosts } from './page-data';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

const defaultPostLimit = 9;

const searchParamsCache = createSearchParamsCache({
  tag: parseAsString,
  before: parseAsString,
  after: parseAsString,
  limit: parseAsInteger.withDefault(defaultPostLimit),
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Blog');
  const blog = await getBlog();

  return {
    title: blog?.name ?? t('title'),
    description:
      blog?.description && blog.description.length > 150
        ? `${blog.description.substring(0, 150)}...`
        : blog?.description,
  };
}

async function getEmptyStateTitle(): Promise<string | null> {
  const t = await getTranslations('Blog.Empty');

  return t('title');
}

async function getEmptyStateSubtitle(): Promise<string | null> {
  const t = await getTranslations('Blog.Empty');

  return t('subtitle');
}

export default async function Blog(props: Props) {
  const blog = await getBlog();

  if (!blog) {
    return notFound();
  }

  const parsedSearchParams = Streamable.from(async () =>
    searchParamsCache.parse(await props.searchParams),
  );

  const streamableBlogPosts = Streamable.from(async () => {
    const searchParamsParsed = await parsedSearchParams;

    return getBlogPosts(searchParamsParsed);
  });

  const breadcrumbs = Streamable.from(async () => {
    const { tag } = await parsedSearchParams;
    const tagCrumb = tag ? [{ label: tag, href: '#' }] : [];

    return [
      {
        label: 'Home',
        href: '/',
      },
      {
        label: blog.name,
        href: tag ? blog.path : '#',
      },
      ...tagCrumb,
    ];
  });

  const posts = Streamable.from(async () => {
    const blogPosts = await streamableBlogPosts;

    return blogPosts?.posts ?? [];
  });

  const paginationInfo = Streamable.from(async () => {
    const blogPosts = await streamableBlogPosts;

    return pageInfoTransformer(blogPosts?.pageInfo ?? defaultPageInfo);
  });

  return (
    <FeaturedBlogPostList
      breadcrumbs={breadcrumbs}
      description={blog.description}
      emptyStateSubtitle={getEmptyStateSubtitle()}
      emptyStateTitle={getEmptyStateTitle()}
      paginationInfo={paginationInfo}
      placeholderCount={6}
      posts={posts}
      title={blog.name}
    />
  );
}
