export const dynamic = 'force-static';

export async function GET() {
  const robotsTxt = `User-agent: *\nDisallow:\nSitemap: https://example.com/sitemap.xml\n`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
    },
  });
}
