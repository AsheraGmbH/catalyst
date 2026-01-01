import { Bodl } from './bodl';

const bodl = new Bodl({
  channelId: Number(process.env.NEXT_PUBLIC_BIGCOMMERCE_CHANNEL_ID ?? process.env.BIGCOMMERCE_CHANNEL_ID ?? 1),
  googleAnalytics: {
    id: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? '',
    consentModeEnabled: false,
    developerId: 'dMjk3Nj',
  },
  googleTagManager: {
    id: process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID ?? '',
    consentModeEnabled: false,
    developerId: 'dMjk3Nj',
  },
});

if (typeof window !== 'undefined') {
  bodl.initialize();
}

export { bodl };

