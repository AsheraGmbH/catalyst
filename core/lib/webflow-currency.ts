'use client';

/**
 * Utility to sync currency selection with webflow pages
 * Webflow pages have a setupCurrencySwitcher() function that expects
 * setCurrency('EUR') or setCurrency('USD') to be called
 */

/**
 * Gets the current currency from the cookie
 */
export function getCurrentCurrency(): 'EUR' | 'USD' {
  if (typeof document === 'undefined') return 'EUR';
  
  const cookies = document.cookie.split('; ');
  const currencyCookie = cookies.find(cookie => cookie.startsWith('currencyCode='));
  
  if (!currencyCookie) return 'EUR';
  
  const currencyCode = currencyCookie.split('=')[1];
  return currencyCode === 'USD' ? 'USD' : 'EUR';
}

/**
 * Sets currency on webflow pages by calling the setCurrency function
 * that webflow's setupCurrencySwitcher() expects
 * 
 * Note: Webflow's setCurrency is scoped inside setupCurrencySwitcher(),
 * but it stores currency in localStorage. We sync via localStorage and
 * try to trigger the webflow currency switcher.
 */
export function syncCurrencyWithWebflow(): void {
  if (typeof window === 'undefined') return;
  
  const currency = getCurrentCurrency();
  
  // Webflow stores currency in localStorage with key 'selectedCurrency'
  // Update it to match our cookie
  localStorage.setItem('selectedCurrency', currency);
  
  // Try multiple approaches to trigger webflow's currency switcher:
  
  // 1. Check if setCurrency is exposed on window (some webflow pages might expose it)
  const webflowCurrencyFunction = (window as any).setCurrency;
  if (typeof webflowCurrencyFunction === 'function') {
    webflowCurrencyFunction(currency);
    return;
  }
  
  // 2. Try to trigger via button clicks (webflow buttons call setCurrency)
  // Note: Webflow buttons are reversed - USD button sets EUR, EUR button sets USD
  // So we need to click the opposite button
  const targetButton = currency === 'EUR' ? '.button-usd' : '.button-eur';
  const currencyButtons = document.querySelectorAll(targetButton);
  if (currencyButtons.length > 0) {
    (currencyButtons[0] as HTMLElement)?.click();
    return;
  }
  
  // 3. If buttons don't exist yet, wait for webflow scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => syncCurrencyWithWebflow(), 1500);
    });
  } else {
    // Retry after a delay to allow webflow scripts to initialize
    setTimeout(() => {
      const retryButtons = document.querySelectorAll(targetButton);
      if (retryButtons.length > 0) {
        (retryButtons[0] as HTMLElement)?.click();
      }
    }, 1500);
  }
}

/**
 * Watches for currency cookie changes and syncs with webflow
 */
export function watchCurrencyChanges(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  let lastCurrency = getCurrentCurrency();
  
  const checkCurrency = () => {
    const currentCurrency = getCurrentCurrency();
    if (currentCurrency !== lastCurrency) {
      lastCurrency = currentCurrency;
      syncCurrencyWithWebflow();
    }
  };
  
  // Check immediately
  syncCurrencyWithWebflow();
  
  // Watch for changes every 500ms
  const interval = setInterval(checkCurrency, 500);
  
  // Also listen for storage events (in case currency is changed in another tab)
  const handleStorageChange = () => {
    checkCurrency();
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', handleStorageChange);
  };
}

