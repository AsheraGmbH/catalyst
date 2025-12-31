import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

export type CatchAllParams = { path?: string[] };

export const PUBLIC_ASSET_REVALIDATE_SECONDS = 2592000; // 30 days
const HTML_EDGE_MAX_AGE_SECONDS = 86400; // 1 day
const STATIC_STALE_WHILE_REVALIDATE_SECONDS = 604800; // 7 days

export type RequestMethod = 'GET' | 'HEAD';

type AssetCacheEntry = {
  data: Buffer;
  relativePath: string;
  absolutePath: string;
  size: number;
  mtimeMs: number;
};

const assetCache = new Map<string, AssetCacheEntry>();

function sanitizeRelativePath(raw: string): string | null {
  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.some((segment) => segment === '..')) {
    return null;
  }

  return segments.join('/');
}

export function contentTypeFor(p: string): string {
  const ext = p.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html':
      return 'text/html; charset=utf-8';
    case 'css':
      return 'text/css; charset=utf-8';
    case 'js':
      return 'application/javascript; charset=utf-8';
    case 'json':
      return 'application/json; charset=utf-8';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'ico':
      return 'image/x-icon';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'ttf':
      return 'font/ttf';
    case 'otf':
      return 'font/otf';
    default:
      return 'application/octet-stream';
  }
}

function headersFor(pathname: string, size?: number): HeadersInit {
  const ct = contentTypeFor(pathname);
  const headers: Record<string, string> = { 'Content-Type': ct };

  if (typeof size === 'number') {
    headers['Content-Length'] = size.toString();
  }

  if (ct.startsWith('text/html')) {
    headers['Cache-Control'] =
      `public, max-age=${HTML_EDGE_MAX_AGE_SECONDS}, s-maxage=${HTML_EDGE_MAX_AGE_SECONDS}, stale-while-revalidate=${HTML_EDGE_MAX_AGE_SECONDS}`;
    headers['Surrogate-Control'] = `max-age=${HTML_EDGE_MAX_AGE_SECONDS}, stale-while-revalidate=${HTML_EDGE_MAX_AGE_SECONDS}`;
  } else {
    headers['Cache-Control'] =
      `public, max-age=${PUBLIC_ASSET_REVALIDATE_SECONDS}, s-maxage=${PUBLIC_ASSET_REVALIDATE_SECONDS}, stale-while-revalidate=${STATIC_STALE_WHILE_REVALIDATE_SECONDS}, immutable`;
    headers['Surrogate-Control'] = `max-age=${PUBLIC_ASSET_REVALIDATE_SECONDS}, stale-while-revalidate=${STATIC_STALE_WHILE_REVALIDATE_SECONDS}`;
  }

  return headers;
}

async function resolvePublicPath(raw: string): Promise<{
  sanitizedPath: string;
  absolutePath: string;
} | null> {
  const sanitized = sanitizeRelativePath(raw);

  if (sanitized == null) {
    return null;
  }

  const abs = path.join(PUBLIC_DIR, sanitized);
  const resolved = path.resolve(abs);

  if (!resolved.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return { sanitizedPath: sanitized, absolutePath: resolved };
}

async function readPublicFile(raw: string): Promise<AssetCacheEntry | null> {
  const resolved = await resolvePublicPath(raw);

  if (!resolved) {
    return null;
  }

  let finalPath = resolved.absolutePath;
  let stat;
  try {
    stat = await fs.stat(finalPath);
    if (stat.isDirectory()) {
      finalPath = path.join(finalPath, 'index.html');
      stat = await fs.stat(finalPath);
    }
  } catch {
    return null;
  }

  const cacheKey = path.relative(PUBLIC_DIR, finalPath).replace(/\\/g, '/');
  const cached = assetCache.get(cacheKey);

  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
    return cached;
  }

  try {
    const data = await fs.readFile(finalPath);
    const rel = '/' + cacheKey;
    const entry: AssetCacheEntry = {
      data,
      relativePath: rel,
      absolutePath: finalPath,
      size: data.byteLength,
      mtimeMs: stat.mtimeMs,
    };
    assetCache.set(cacheKey, entry);
    return entry;
  } catch {
    assetCache.delete(cacheKey);
    return null;
  }
}

export async function servePublicPath(rawPath: string, method: RequestMethod = 'GET') {
  const asset = await readPublicFile(rawPath);

  if (!asset) {
    return new NextResponse('Not found', {
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const headers = new Headers(headersFor(asset.relativePath, asset.size));

  if (method === 'HEAD') {
    return new NextResponse(null, { status: 200, headers });
  }

  return new NextResponse(asset.data, { status: 200, headers });
}

export async function servePublicSegments(
  segments: readonly string[],
  method: RequestMethod = 'GET',
) {
  return servePublicPath(segments.join('/'), method);
}

function toSegments(baseSegments: readonly string[], params: CatchAllParams): string[] {
  return [...baseSegments, ...(params.path ?? [])];
}

export function createPublicAssetRouteHandlers(baseSegments: readonly string[]) {
  return {
    GET(_req: NextRequest, { params }: { params: CatchAllParams }) {
      return servePublicSegments(toSegments(baseSegments, params));
    },
    HEAD(_req: NextRequest, { params }: { params: CatchAllParams }) {
      return servePublicSegments(toSegments(baseSegments, params), 'HEAD');
    },
  };
}
