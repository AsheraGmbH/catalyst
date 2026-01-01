import { NextRequest, NextResponse } from 'next/server';
import BuilderIoServer from '~/lib/builder-io/BuilderIoServer';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ html: '' }, { status: 200 });
  }

  try {
    const html = await BuilderIoServer({ slug });
    return NextResponse.json({ html: html || '' });
  } catch (error) {
    console.warn('[Builder.io API] Error:', error);
    return NextResponse.json({ html: '' }, { status: 200 });
  }
}
