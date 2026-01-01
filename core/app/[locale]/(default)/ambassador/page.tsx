import { setRequestLocale } from 'next-intl/server';
import { getWebflowHtmlContent } from '~/lib/webflow-html';
import { WebflowCurrencySync } from '~/components/webflow-currency-sync';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AmbassadorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const html = await getWebflowHtmlContent('ambassador.html');

  if (!html) {
    return <div>Ambassador page not found</div>;
  }

  return (
    <>
      <WebflowCurrencySync />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

