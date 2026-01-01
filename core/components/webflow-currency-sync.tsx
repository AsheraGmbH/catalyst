'use client';

import { useEffect } from 'react';
import { watchCurrencyChanges } from '~/lib/webflow-currency';

/**
 * Client component that syncs currency selection with webflow pages
 * This component should be included in all webflow page routes
 */
export function WebflowCurrencySync() {
  useEffect(() => {
    const cleanup = watchCurrencyChanges();
    return cleanup;
  }, []);

  return null;
}
