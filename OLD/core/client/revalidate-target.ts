export const FALLBACK_REVALIDATE_SECONDS = 10800; // 3 hours

const envRevalidateTarget = Number(process.env.DEFAULT_REVALIDATE_TARGET);

export const DEFAULT_REVALIDATE_SECONDS =
  Number.isFinite(envRevalidateTarget) && envRevalidateTarget >= 1
    ? Math.floor(envRevalidateTarget)
    : FALLBACK_REVALIDATE_SECONDS;

// Next.js expects a `revalidate` export for route handlers and metadata
// generation. Keep it in sync with the derived default above.
export const revalidate = DEFAULT_REVALIDATE_SECONDS;

export function resolveRevalidateSeconds(value?: number | null): number {
  if (value != null) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue) && numericValue >= 1) {
      return Math.floor(numericValue);
    }
  }

  return DEFAULT_REVALIDATE_SECONDS;
}
