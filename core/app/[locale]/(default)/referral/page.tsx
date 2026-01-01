import { setRequestLocale } from 'next-intl/server';
import { getWebflowHtmlContent } from '~/lib/webflow-html';
import { WebflowCurrencySync } from '~/components/webflow-currency-sync';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ReferralPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const html = await getWebflowHtmlContent('referral.html');

  if (!html) {
    return <div>Referral page not found</div>;
  }

  return (
    <>
      <WebflowCurrencySync />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

