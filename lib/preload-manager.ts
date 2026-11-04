'use client';

import { safeFetchJson } from './utils';

/**
 * YemenFlex Intelligent Preloading Engine (محرك التحميل المسبق فائق السرعة)
 *
 * Provides:
 * 1. Image poster & banner preloading with memory cache and IntersectionObserver
 * 2. Video stream initial chunk preloading (HTTP Range bytes=0-524287)
 * 3. Media details API pre-fetching with in-memory caching
 * 4. Next episode & adjacent slider preloading
 * 5. Preload telemetry & live performance counters
 */

interface PreloadStats {
  imagesPreloaded: number;
  videosPreloaded: number;
  detailsPreloaded: number;
  totalSavedMsEstimate: number;
}

const preloadedImages = new Set<string>();
const preloadedVideos = new Set<string>();
const detailsCache = new Map<string, any>();

let statsListeners: Array<(stats: PreloadStats) => void> = [];

export function getPreloadStats(): PreloadStats {
  return {
    imagesPreloaded: preloadedImages.size,
    videosPreloaded: preloadedVideos.size,
    detailsPreloaded: detailsCache.size,
    totalSavedMsEstimate: (preloadedImages.size * 220) + (preloadedVideos.size * 950),
  };
}

export function subscribePreloadStats(cb: (stats: PreloadStats) => void): () => void {
  statsListeners.push(cb);
  cb(getPreloadStats());
  return () => {
    statsListeners = statsListeners.filter((l) => l !== cb);
  };
}

function notifyStats() {
  const currentStats = getPreloadStats();
  statsListeners.forEach((fn) => {
    try {
      fn(currentStats);
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Check if the user has enabled Data Saver mode
 */
export function isSaveDataActive(): boolean {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.saveData) {
      return true;
    }
  }
  return false;
}

/**
 * Check user preference for aggressive preloading
 */
export function isPreloadEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const pref = localStorage.getItem('yemenflex_preload_enabled');
  if (pref !== null) return pref === 'true';
  return !isSaveDataActive();
}

export function setPreloadEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('yemenflex_preload_enabled', enabled ? 'true' : 'false');
  notifyStats();
}

/**
 * 1. Preload an Image (Posters, Banners, Backdrops)
 */
export function preloadImage(url?: string, priority: 'high' | 'auto' | 'low' = 'auto'): Promise<boolean> {
  if (!url || typeof window === 'undefined' || !isPreloadEnabled()) {
    return Promise.resolve(false);
  }

  if (preloadedImages.has(url)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const img = new Image();
    if ('fetchPriority' in img) {
      (img as any).fetchPriority = priority;
    }
    img.src = url;
    img.onload = () => {
      preloadedImages.add(url);
      notifyStats();
      resolve(true);
    };
    img.onerror = () => {
      // Mark as tried to avoid retry storm
      preloadedImages.add(url);
      resolve(false);
    };
  });
}

/**
 * 2. Preload Video Initial Segment / Chunk (512KB Range request)
 * Downloads video container metadata (moov/ftyp or HLS manifest) into browser cache
 */
export function preloadVideoChunk(rawVideoUrl?: string, referer?: string): Promise<boolean> {
  if (!rawVideoUrl || typeof window === 'undefined' || !isPreloadEnabled()) {
    return Promise.resolve(false);
  }

  // Skip preloading if the user has very slow connection (2G)
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g')) {
      return Promise.resolve(false);
    }
  }

  const cacheKey = rawVideoUrl;
  if (preloadedVideos.has(cacheKey)) {
    return Promise.resolve(true);
  }

  const isHls = rawVideoUrl.includes('.m3u8');
  // Determine if direct or proxied
  const targetUrl = rawVideoUrl.includes('google')
    ? rawVideoUrl
    : `/api/proxy/video?url=${encodeURIComponent(rawVideoUrl)}&referer=${encodeURIComponent(referer || 'https://akwam.ss/')}`;

  return new Promise((resolve) => {
    // For HLS, fetch the top-level m3u8 playlist text
    // For MP4, request bytes 0 to 524287 (512 KB) which covers ftyp/moov headers
    const headers: HeadersInit = isHls ? {} : { Range: 'bytes=0-524287' };

    fetch(targetUrl, {
      method: 'GET',
      headers,
      mode: 'cors',
      cache: 'force-cache',
    })
      .then((res) => {
        if (res.ok || res.status === 206) {
          preloadedVideos.add(cacheKey);
          notifyStats();
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(() => {
        // Direct CORS error or network blip - resolve gracefully
        resolve(false);
      });
  });
}

/**
 * 3. Preload Watch Page Details API
 */
export async function preloadMediaDetails(mediaId: string): Promise<any | null> {
  if (!mediaId || typeof window === 'undefined' || !isPreloadEnabled()) {
    return null;
  }

  if (detailsCache.has(mediaId)) {
    return detailsCache.get(mediaId);
  }

  try {
    const result = await safeFetchJson<any>(`/api/details?id=${encodeURIComponent(mediaId)}`, {
      cache: 'force-cache',
    });

    if (result.ok && result.data?.success && result.data.data) {
      const item = result.data.data;
      detailsCache.set(mediaId, item);
      notifyStats();

      // Chain: Preload the backdrop and primary video stream of this media item
      if (item.banner) preloadImage(item.banner, 'high');
      if (item.poster) preloadImage(item.poster, 'auto');

      const primaryServer = item.servers?.[0] || item.episodes?.[0]?.servers?.[0];
      if (primaryServer?.url) {
        preloadVideoChunk(primaryServer.url, primaryServer.referer);
      }

      return item;
    }
  } catch {
    // Ignore prefetch error
  }
  return null;
}

export function getCachedMediaDetails(mediaId: string): any | null {
  return detailsCache.get(mediaId) || null;
}

export function setCachedMediaDetails(mediaId: string, item: any): void {
  if (!mediaId || !item || typeof window === 'undefined') return;
  const existing = detailsCache.get(mediaId);
  // Keep existing detailed servers/episodes if available
  if (existing && existing.servers && existing.servers.length > 0 && (!item.servers || item.servers.length === 0)) {
    return;
  }
  detailsCache.set(mediaId, { ...existing, ...item });
}

/**
 * Preload an entire MediaItem (Poster, Banner, and initial video server)
 */
export function preloadMediaItem(item: {
  id?: string;
  poster?: string;
  banner?: string;
  servers?: Array<{ url: string; referer?: string }>;
}) {
  if (!isPreloadEnabled()) return;

  if (item.poster) preloadImage(item.poster, 'auto');
  if (item.banner) preloadImage(item.banner, 'low');

  if (item.servers && item.servers.length > 0 && item.servers[0]?.url) {
    // Preload video header on idle
    if (typeof window !== 'undefined') {
      const schedule = 'requestIdleCallback' in window
        ? (window as any).requestIdleCallback
        : (fn: any) => setTimeout(fn, 200);

      schedule(() => {
        preloadVideoChunk(item.servers![0].url, item.servers![0].referer);
      });
    }
  }

  if (item.id) {
    preloadMediaDetails(item.id);
  }
}
