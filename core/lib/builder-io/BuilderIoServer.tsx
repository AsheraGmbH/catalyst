"use server";

const API_KEY = "e7c55d0a93074d22bfa603deec56f3a2";
// Literal to keep ISR hints compatible with Next.js static analysis.
const REVALIDATE_SECONDS = 86400; // 1 day

export default async function BuilderIoServer({ slug }: { slug: string }) {
  // Skip Builder.io fetch during build to prevent CSS file resolution errors
  // The HTML will be fetched at runtime via ISR when the page is requested
  // During build, Next.js tries to statically analyze the HTML which causes errors
  // Check multiple conditions to reliably detect build phase
  const isBuildPhase = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    (process.env.VERCEL === '1' && !process.env.VERCEL_ENV) ||
    (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) ||
    process.env.__NEXT_PRIVATE_PREBUNDLED_REACT;
  
  if (isBuildPhase) {
    return "";
  }

  // NOTE: In your routes, `slug` is actually the BigCommerce productId (e.g., "139")
  // and your Builder entries are keyed to `/product/<id>`. If you switch Builder to slugs,
  // this will work the same — it's just a string concat.
  const urlPath = `/product/${encodeURIComponent(slug)}`;

  const endpoint =
    `https://cdn.builder.io/api/v3/html/below-product?` +
    `apiKey=${API_KEY}&url=${encodeURIComponent(urlPath)}`;

  let html = "";

  try {
    const res = await fetch(endpoint, {
      // ✅ Cache the API response separately from the page (ISR)
      next: { revalidate: REVALIDATE_SECONDS, tags: [`builder:below:${slug}`] },
    });

    if (!res.ok) {
      console.error(`[Builder.io] HTML fetch failed: ${res.status} ${res.statusText}`);
      return "";
    }

    const data = await res.json();
    html = data?.data?.html ?? "";
  } catch (err) {
    // During build, return empty string to prevent build errors
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.warn("[Builder.io] HTML fetch error (build time):", err);
    } else {
      console.error("[Builder.io] HTML fetch error:", err);
    }
    return "";
  }

  // Return early if no HTML to prevent processing empty content
  if (!html || html.trim() === "") {
    return "";
  }

  // 🧼 Strip Builder tracking pixel <img>
  html = html.replace(/<img[^>]+builder\.io\/api\/v\d+\/pixel[^>]*>/gi, "");

  // 🧼 Strip webcomponents.js script
  html = html.replace(/<script[^>]+builder\.io\/js\/webcomponents[^<]*<\/script>\s*/gi, "");

  // 🧼 Strip any <div class="builder-pixel..."> wrappers
  html = html.replace(/<div[^>]*builder-pixel[^>]*>.*?<\/div>/gsi, "");

  // 🧼 Strip CSS link tags that might reference local files (causes build errors)
  html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");

  // 🧼 Strip any references to browser/default-stylesheet.css or similar local paths
  // This catches href="browser/...", src="browser/...", url(browser/...), etc.
  html = html.replace(/["']?browser\/[^"'\s>)]+\.css["']?/gi, "");

  // 🧼 Strip style tags that might contain problematic content
  html = html.replace(/<style[^>]*>.*?<\/style>/gsi, "");

  // 🧼 Strip any @import statements in CSS that might reference local files
  html = html.replace(/@import\s+["']?[^"']*browser\/[^"']*["']?/gi, "");

  // 🧼 Strip any url() references to browser/ paths
  html = html.replace(/url\(["']?[^"')]*browser\/[^"')]*["']?\)/gi, "");

  return html;
}
