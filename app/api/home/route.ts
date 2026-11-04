import { NextResponse } from 'next/server';
import { getHomeContent } from '@/lib/scraper-service';

export async function GET() {
  const data = await getHomeContent();
  return NextResponse.json(data);
}
