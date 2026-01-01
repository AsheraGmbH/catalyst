/**
 * Iubenda consent cookie utilities
 * Checks for iubenda consent cookie format: _iub_cs-{siteId}=...
 */

/**
 * Checks if iubenda consent cookie exists and consent is given
 * Cookie format: _iub_cs-{siteId}=...
 */
export function isIubendaConsentGiven(): boolean {
  if (typeof document === 'undefined') return false;
  
  const cookies = document.cookie.split("; ");
  const iubCookie = cookies.find(cookie => /^_iub_cs-\d+=/.test(cookie));
  
  if (!iubCookie) return false;
  
  try {
    const encodedValue = iubCookie.split("=")[1];
    const decodedValue = decodeURIComponent(encodedValue);
    const parsedValue = JSON.parse(decodedValue);
    return parsedValue?.consent === true;
  } catch (error) {
    console.error("Error parsing iubenda consent cookie:", error);
    return false;
  }
}

/**
 * Watches for iubenda consent and calls callback when consent is given
 * @param callback Function to call when consent is given
 * @param interval Polling interval in milliseconds (default: 1000ms)
 * @returns Cleanup function to stop watching
 */
export function watchIubendaConsent(
  callback: () => void,
  interval: number = 1000
): () => void {
  const checkConsent = setInterval(() => {
    if (isIubendaConsentGiven()) {
      clearInterval(checkConsent);
      callback();
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(checkConsent);
}
