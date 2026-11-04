import { NextRequest, NextResponse } from 'next/server';
import { searchMedia } from '@/lib/scraper-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchMedia(q);
  return NextResponse.json({ results });
}
