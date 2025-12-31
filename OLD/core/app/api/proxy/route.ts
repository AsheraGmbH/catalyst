// app/api/proxy/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 2592000;

import { NextRequest, NextResponse } from 'next/server';

import { servePublicPath } from '~/lib/public-assets';

function normalizeRequestedPath(raw: string | null): string {
  // Accept:
  //   ?path=/..., ?p=/..., or ?url=... (absolute or relative)
  // Default to "/"
  let candidate = raw || '/';

  // If absolute URL, take only its pathname
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith('//')) {
    const abs = candidate.startsWith('//') ? 'https:' + candidate : candidate;
    try {
      candidate = new URL(abs).pathname || '/';
    } catch {
      candidate = '/';
    }
  }

  if (!candidate.startsWith('/')) candidate = '/' + candidate;

  if (candidate.endsWith('/')) candidate += 'index.html';

  if (!candidate.includes('.')) candidate += '.html';

  return candidate;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);

  // Preferred param is ?path=; also accept ?p= or legacy ?url=
  const raw = u.searchParams.get('path') ?? u.searchParams.get('p') ?? u.searchParams.get('url');

  const pathname = normalizeRequestedPath(raw);
  return await servePublicPath(pathname);
}
