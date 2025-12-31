export const dynamic = 'force-static';

export async function GET() {
  return new Response(new Uint8Array(), {
    headers: {
      'Content-Type': 'image/x-icon',
    },
  });
}
