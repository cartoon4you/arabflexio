import { NextRequest, NextResponse } from 'next/server';
import { grabLinks } from '@/lib/scraper-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const result = await grabLinks(targetUrl);
  if (!result) {
    return NextResponse.json({ error: 'Failed to extract links' }, { status: 500 });
  }

  return NextResponse.json(result);
}
