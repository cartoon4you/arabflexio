import { NextRequest, NextResponse } from 'next/server';
import { searchMedia, getMediaDetails, deepCrawlTargetPage } from '@/lib/scraper-service';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url') || '';
    const name = request.nextUrl.searchParams.get('name') || '';
    const query = url || name;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'الرابط أو اسم الفيلم مطلوب' },
        { status: 400 }
      );
    }

    const crawlResult = await deepCrawlTargetPage(query);

    return NextResponse.json({
      success: true,
      data: {
        title: crawlResult.title,
        poster: crawlResult.poster,
        source_url: crawlResult.source_url,
        type: crawlResult.type,
        qualities: crawlResult.qualities,
        files: crawlResult.files,
        download_links: crawlResult.files.map((f) => ({
          quality: f.quality,
          server_name: f.filename,
          direct_url: f.direct_url,
          proxy_url: f.proxy_url,
          size: f.size,
        })),
        episodes: crawlResult.episodes || null,
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=43200',
        'CDN-Cache-Control': 'public, s-maxage=1800',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=1800',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'فشل الاستخراج' },
      { status: 500 }
    );
  }
}
