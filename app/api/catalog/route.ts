import { NextRequest, NextResponse } from 'next/server';
import { getCatalogItems } from '@/lib/scraper-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const data = await getCatalogItems(category, page);
  return NextResponse.json(data);
}
