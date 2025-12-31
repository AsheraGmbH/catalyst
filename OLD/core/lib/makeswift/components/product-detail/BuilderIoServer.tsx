"use server";

const API_KEY = "e7c55d0a93074d22bfa603deec56f3a2";
// Literal to keep ISR hints compatible with Next.js static analysis.
const REVALIDATE_SECONDS = 86400; // 1 day

export default async function BuilderIoServer({ slug }: { slug: string }) {
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
    console.error("[Builder.io] HTML fetch error:", err);
    return "";
  }

  // 🧼 Strip Builder tracking pixel <img>
  html = html.replace(/<img[^>]+builder\.io\/api\/v\d+\/pixel[^>]*>/gi, "");

  // 🧼 Strip webcomponents.js script
  html = html.replace(/<script[^>]+builder\.io\/js\/webcomponents[^<]*<\/script>\s*/gi, "");

  // 🧼 Optional: strip any <div class="builder-pixel..."> wrappers
  html = html.replace(/<div[^>]*builder-pixel[^>]*>.*?<\/div>/gsi, "");

  return html;
}
