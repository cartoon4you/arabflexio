import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreCacheWithMeta, setFirestoreCache } from '@/lib/firestore-cache';

export const revalidate = 3600;

const tmdbMemCache = new Map<string, { data: any; expiresAt: number; staleUntil: number }>();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
  }

  const cacheKey = `tmdb_${endpoint.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

  // 1. In-Memory SWR (0ms)
  const memEntry = tmdbMemCache.get(cacheKey);
  const now = Date.now();
  if (memEntry && now <= memEntry.staleUntil) {
    if (now > memEntry.expiresAt) {
      // Trigger background revalidate
      revalidateTmdb(endpoint, cacheKey).catch(() => {});
    }
    return NextResponse.json(memEntry.data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Cache': 'HIT-MEMORY',
      },
    });
  }

  // 2. Firestore Persistent Cache SWR (stored for 7 days)
  const fsEntry = await getFirestoreCacheWithMeta<any>(cacheKey);
  if (fsEntry) {
    tmdbMemCache.set(cacheKey, {
      data: fsEntry.data,
      expiresAt: now + 4 * 60 * 60 * 1000,
      staleUntil: now + 7 * 24 * 60 * 60 * 1000,
    });
    if (fsEntry.isStale) {
      revalidateTmdb(endpoint, cacheKey).catch(() => {});
    }
    return NextResponse.json(fsEntry.data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Cache': 'HIT-FIRESTORE',
      },
    });
  }

  // 3. Cache Miss: Fetch from TMDB API
  const freshData = await revalidateTmdb(endpoint, cacheKey);
  if (freshData) {
    return NextResponse.json(freshData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Cache': 'MISS',
      },
    });
  }

  return NextResponse.json({ results: [] }, { status: 500 });
}

async function revalidateTmdb(endpoint: string, cacheKey: string): Promise<any | null> {
  const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
  if (!TMDB_ACCESS_TOKEN) return null;

  const TMDB_BASE = 'https://api.themoviedb.org/3';
  try {
    const res = await fetch(`${TMDB_BASE}${endpoint}`, {
      headers: { 
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`, 
        accept: 'application/json' 
      }
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();

    const now = Date.now();
    // Cache in memory for 4 hours fresh, 7 days stale
    tmdbMemCache.set(cacheKey, {
      data,
      expiresAt: now + 4 * 60 * 60 * 1000,
      staleUntil: now + 7 * 24 * 60 * 60 * 1000,
    });
    // Cache in Firestore for 7 days fresh, 14 days stale window
    setFirestoreCache(cacheKey, data, 7 * 24 * 60 * 60 * 1000, 14 * 24 * 60 * 60 * 1000);
    return data;
  } catch (error) {
    console.error('TMDB API Fetch Error:', error);
    return null;
  }
}
