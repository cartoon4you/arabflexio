import * as cheerio from 'cheerio';
import dns from 'node:dns';
import { Agent } from 'undici';
import { MediaItem, ServerOption, EpisodeItem, LinkGrabberResult } from './types';
import { SAMPLE_CATALOG } from './catalog-data';
import { getFirestoreCacheWithMeta, setFirestoreCache } from './firestore-cache';

try { dns.setDefaultResultOrder('ipv4first'); } catch {}

const BASE_URL = (process.env.AKWAM_BASE_URL || 'https://akwam.ss').replace(/\/+$/, '');

const DEFAULT_USER_AGENT = process.env.SCRAPER_USER_AGENT || 'CineStream/1.0';

const USER_AGENTS = [
  DEFAULT_USER_AGENT,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  if (process.env.SCRAPER_USER_AGENT) return process.env.SCRAPER_USER_AGENT;
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// TLS bypass is only needed because Akwam's cert chain is often broken behind
// their CDN. This agent is used exclusively for akwam requests.
const akwamAgent = new Agent({
  connect: { rejectUnauthorized: false },
  connections: 20,
  keepAliveTimeout: 30000,
});

// ============ URL / ID helpers ============

function normalizeUrl(url: string): string {
  let cleanUrl = (url || '').trim();
  if (cleanUrl.startsWith('/')) cleanUrl = `${BASE_URL}${cleanUrl}`;
  cleanUrl = cleanUrl
    .replace(/^https?:\/\/(?:www\.)?ak\.sv(?=[/?#]|$)/i, BASE_URL)
    .replace(/^https?:\/\/(?:www\.)?akwam\.to(?=[/?#]|$)/i, BASE_URL)
    .replace(/^https?:\/\/(?:www\.)?akwam\.ss(?=[/?#]|$)/i, BASE_URL);
  try { return new URL(cleanUrl).href; } catch { return cleanUrl; }
}

function encodeId(relativePath: string): string {
  // base64url is reversible and never mangles `_` inside the path
  return 'b64_' + Buffer.from(relativePath, 'utf-8').toString('base64url');
}

function decodeId(id: string): string {
  if (!id) return '';
  if (id.startsWith('b64_')) {
    try { return Buffer.from(id.slice(4), 'base64url').toString('utf-8'); }
    catch { return ''; }
  }
  // Legacy: encodeURIComponent(x).replace(/%/g, '_') — kept for existing DB rows
  try { return decodeURIComponent(id.replace(/_/g, '%')); }
  catch { return ''; }
}

// ============ Video extraction ============

function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (/\.(jpe?g|png|webp|gif|svg|ico)(\?|#|$)/i.test(lower)) return false;
  if (lower.includes('img.downet.net')) return false;
  return (
    lower.includes('.mp4') ||
    lower.includes('.mkv') ||
    lower.includes('.webm') ||
    lower.includes('.m3u8') ||
    lower.includes('downet.net/download/')
  );
}

function cleanQualityLabel(label: string, fallbackUrl: string): string {
  const formatted = (label || '').replace(/\s+/g, ' ').trim();
  const m = formatted.match(/(2160|4k|1080|720|480|360)/i);
  if (m) {
    const v = m[1].toLowerCase();
    return v === '4k' || v === '2160' ? '4K' : `${v}p`;
  }
  const urlM = fallbackUrl.match(/(2160|1080|720|480|360)/i);
  if (urlM) return urlM[1] === '2160' ? '4K' : `${urlM[1]}p`;
  return 'HD';
}

function parseQualityRank(q: string): number {
  if (!q) return 0;
  if (/4k|2160/i.test(q)) return 2160;
  const m = q.match(/(\d{3,4})/);
  return m ? parseInt(m[1], 10) : 0;
}

function extractVideoLinksFromDom($: cheerio.CheerioAPI): ServerOption[] {
  const out: ServerOption[] = [];
  const seen = new Set<string>();

  const push = (rawUrl: string, label: string) => {
    if (!rawUrl || !isVideoUrl(rawUrl)) return;
    let clean = rawUrl.replace(/^(intent:\/\/|intent:|vlc:\/\/)/i, '').trim();
    if (clean.includes('#Intent;')) clean = clean.split('#Intent;')[0];
    if (!clean.startsWith('http')) return;
    if (seen.has(clean)) return;
    seen.add(clean);

    const qualityLabel = cleanQualityLabel(label, clean);
    const quality = parseQualityRank(qualityLabel) || 720;
    out.push({
      name: `${qualityLabel} - سيرفر ${out.length + 1}`,
      quality,
      url: clean,
      referer: BASE_URL + '/',
      type: clean.includes('.m3u8') ? 'hls' : 'mp4',
    });
  };

  $('video source, source').each((_, el) => {
    const src = $(el).attr('src');
    const label = $(el).attr('size') || $(el).attr('data-quality') || $(el).attr('title') || '';
    if (src) push(src, label);
  });

  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (isVideoUrl(href)) push(href, $(el).text().replace(/\s+/g, ' ').trim());
  });

  return out;
}

async function resolveStreamServers($: cheerio.CheerioAPI, _pageUrl: string): Promise<ServerOption[]> {
  const direct = extractVideoLinksFromDom($);
  if (direct.length > 0) return direct.sort((a, b) => b.quality - a.quality);

  const watchTargets: string[] = [];
  const downloadTargets: string[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    let href = $(el).attr('href') || '';
    if (!href) return;
    href = normalizeUrl(href);
    if (!href.startsWith('http')) return;
    if (seen.has(href)) return;
    if (href.includes('/watch/')) { seen.add(href); watchTargets.push(href); }
    else if (href.includes('/download/')) { seen.add(href); downloadTargets.push(href); }
  });

  // Interleave watch + download so download pages aren't starved by many watch links
  const targets = [...watchTargets.slice(0, 3), ...downloadTargets.slice(0, 3)];
  if (targets.length === 0) return [];

  const results = await Promise.allSettled(targets.map(u => fetchHTML(u, 15000)));
  const combined: ServerOption[] = [];
  const seenUrls = new Set<string>();

  for (const res of results) {
    if (res.status !== 'fulfilled' || !res.value) continue;
    for (const s of extractVideoLinksFromDom(res.value)) {
      if (!seenUrls.has(s.url)) { seenUrls.add(s.url); combined.push(s); }
    }
  }
  return combined.sort((a, b) => b.quality - a.quality);
}

// ============ Cache ============

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

export class ConcurrentMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtlMs: number;
  private defaultStaleMs: number;

  constructor(
    defaultTtlMs: number = 30 * 60 * 1000,
    defaultStaleMs: number = 24 * 60 * 60 * 1000
  ) {
    this.defaultTtlMs = defaultTtlMs;
    this.defaultStaleMs = defaultStaleMs;
  }

  get(key: string): T | null {
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.staleUntil) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  getWithStatus(key: string): { data: T; isStale: boolean } | null {
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.staleUntil) {
      this.cache.delete(key);
      return null;
    }
    return { data: entry.data, isStale: now > entry.expiresAt };
  }

  set(key: string, data: T, ttlMs?: number, staleMs?: number): void {
    if (!key) return;
    const ttl = ttlMs ?? this.defaultTtlMs;
    const stale = staleMs ?? Math.max(ttl * 3, this.defaultStaleMs);
    const now = Date.now();
    this.cache.set(key, { data, expiresAt: now + ttl, staleUntil: now + stale });
  }

  delete(key: string): boolean { return this.cache.delete(key); }
  clear(): void { this.cache.clear(); }
}

export const homeContentCache = new ConcurrentMemoryCache<any>(30 * 60 * 1000, 24 * 60 * 60 * 1000);
export const mediaDetailsCache = new ConcurrentMemoryCache<MediaItem>(4 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000);
export const catalogQueryCache = new ConcurrentMemoryCache<any>(2 * 60 * 60 * 1000, 24 * 60 * 60 * 1000);
export const searchMemoryCache = new ConcurrentMemoryCache<MediaItem[]>(60 * 60 * 1000, 24 * 60 * 60 * 1000);
export const htmlCache = new ConcurrentMemoryCache<string>(30 * 60 * 1000, 2 * 60 * 60 * 1000);
export const videoStreamsCache = new ConcurrentMemoryCache<ServerOption[]>(45 * 60 * 1000, 2 * 60 * 60 * 1000);

export function invalidateStreams(mediaId: string): void {
  if (!mediaId) return;
  videoStreamsCache.delete(mediaId);
}

const pendingRequests = new Map<string, Promise<any>>();

export const STANDARD_TIMEOUT_MS = 6000;

// ============ HTML fetching ============

export async function fetchHTML(
  url: string,
  timeoutMs: number = STANDARD_TIMEOUT_MS
): Promise<cheerio.CheerioAPI | null> {
  const targetUrl = normalizeUrl(url);
  const cachedHtml = htmlCache.get(targetUrl);
  if (cachedHtml) return cheerio.load(cachedHtml, { xml: false });

  const cacheKey = `fetch_${targetUrl}`;
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);

  const fetchPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          Referer: BASE_URL + '/',
        },
        signal: controller.signal,
        dispatcher: akwamAgent,
        redirect: 'follow',
        cache: 'no-store',
      } as any);

      if (!response.ok) return null;
      const html = await response.text();
      htmlCache.set(targetUrl, html, 15 * 60 * 1000);
      return cheerio.load(html, { xml: false });
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// ============ Entry-box parser ============

function parseEntryBoxes($: cheerio.CheerioAPI, defaultType?: 'movie' | 'series'): MediaItem[] {
  const items: MediaItem[] = [];

  $('.entry-box').each((_, el) => {
    const box = $(el);
    const titleEl = box.find('.entry-title a, h3 a');
    const title = titleEl.text().trim() || box.find('img').attr('alt') || '';
    const rawLink = box.find('.entry-image a.box').attr('href') || titleEl.attr('href') || '';
    if (!title || !rawLink) return;

    const absoluteLink = normalizeUrl(rawLink);

    const imgEl = box.find('.entry-image img, picture img');
    let poster = imgEl.attr('data-src') || imgEl.attr('src') || '';
    if (poster.includes('placeholder.png') && imgEl.attr('data-src')) poster = imgEl.attr('data-src') || '';
    if (poster && !poster.startsWith('http')) poster = normalizeUrl(poster);

    const rating = box.find('.label.rating, .rating').text().replace(/[^\d.]/g, '').trim() || '7.5';
    const year = box.find('.badge-secondary, .badge-pill:first').text().trim() || '2024';

    const genres: string[] = [];
    box.find('.badge-light, .badge-pill').each((_, g) => {
      const gText = $(g).text().trim();
      if (gText && !genres.includes(gText) && gText !== year) genres.push(gText);
    });

    const isSeries = absoluteLink.includes('/series/') || (defaultType === 'series' && !absoluteLink.includes('/movie/'));
    const isArabic = /[\u0600-\u06FF]/.test(title);
    const isTurkish = genres.some(g => g.includes('تركي') || g.includes('تركيا')) || title.includes('تركي');
    const isAnime = genres.some(g => g.includes('انمي') || g.includes('أنمي') || g.toLowerCase().includes('anime'));

    let category = isSeries ? 'arabic-series' : 'foreign-movies';
    let categoryLabel = isSeries ? 'مسلسلات' : 'أفلام';

    if (isSeries) {
      if (isTurkish) { category = 'turkish-series'; categoryLabel = 'مسلسلات تركية'; }
      else if (isAnime) { category = 'anime'; categoryLabel = 'أنمي'; }
      else if (isArabic) { category = 'arabic-series'; categoryLabel = 'مسلسلات عربية'; }
      else { category = 'foreign-series'; categoryLabel = 'مسلسلات أجنبية'; }
    } else {
      if (isAnime) { category = 'anime'; categoryLabel = 'أنمي'; }
      else if (isArabic) { category = 'arabic-movies'; categoryLabel = 'أفلام عربية'; }
      else { category = 'foreign-movies'; categoryLabel = 'أفلام أجنبية'; }
    }

    const relativePath = absoluteLink.replace(BASE_URL, '').replace(/^\/+/, '');
    const id = encodeId(relativePath);

    items.push({
      id,
      title,
      poster: poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
      story: `شاهد الآن ${title} (${year}) بجودة عالية وسيرفرات مشاهدة وتحميل مباشرة.`,
      rating,
      year,
      category,
      categoryLabel,
      type: isSeries ? 'series' : 'movie',
      genres: genres.length > 0 ? genres : [isSeries ? 'دراما' : 'أكشن'],
      // Servers are resolved lazily via getMediaDetails() — never fabricate URLs.
      servers: [],
    });
  });

  return items;
}

// ============ Home content ============

export async function getHomeContent(): Promise<{
  featured: MediaItem[];
  latestMovies: MediaItem[];
  latestSeries: MediaItem[];
  trending: MediaItem[];
}> {
  const cacheKey = 'home_screen_latest_additions_v2';

  const triggerBackgroundRevalidation = (): Promise<any> => {
    if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey) || Promise.resolve(null);

    const bgPromise = (async () => {
      let scrapedMovies: MediaItem[] = [];
      let scrapedSeries: MediaItem[] = [];

      try {
        const [$movies, $series] = await Promise.all([
          fetchHTML(`${BASE_URL}/movies`, STANDARD_TIMEOUT_MS),
          fetchHTML(`${BASE_URL}/series`, STANDARD_TIMEOUT_MS),
        ]);
        if ($movies) scrapedMovies = parseEntryBoxes($movies, 'movie');
        if ($series) scrapedSeries = parseEntryBoxes($series, 'series');
      } catch (error) {
        console.warn('Home scrape error:', error);
      }

      if (scrapedMovies.length === 0 && scrapedSeries.length === 0) return null;

      const allMovies = [...scrapedMovies, ...SAMPLE_CATALOG.filter(i => i.type === 'movie')];
      const allSeries = [...scrapedSeries, ...SAMPLE_CATALOG.filter(i => i.type === 'series')];

      const featured = [
        ...allMovies.slice(0, 4).map(item => ({ ...item, isFeatured: true })),
        ...allSeries.slice(0, 3).map(item => ({ ...item, isFeatured: true })),
      ];

      const trending = [...allMovies.slice(4, 14), ...allSeries.slice(3, 13)];

      const freshData = {
        featured,
        latestMovies: allMovies.slice(0, 20),
        latestSeries: allSeries.slice(0, 20),
        trending: trending.slice(0, 20),
      };

      homeContentCache.set(cacheKey, freshData, 30 * 60 * 1000, 24 * 60 * 60 * 1000);
      setFirestoreCache(cacheKey, freshData, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000);
      return freshData;
    })()
      // Never let a background revalidation rejection crash the process,
      // and never let it propagate through Promise.race() to the caller.
      .catch((e) => { console.warn('Home revalidation failed:', e); return null; })
      .finally(() => { pendingRequests.delete(cacheKey); });

    pendingRequests.set(cacheKey, bgPromise);
    return bgPromise;
  };

  const memEntry = homeContentCache.getWithStatus(cacheKey);
  if (memEntry) {
    if (memEntry.isStale) void triggerBackgroundRevalidation();
    return memEntry.data;
  }

  const fsEntry = await getFirestoreCacheWithMeta<any>(cacheKey);
  if (fsEntry) {
    homeContentCache.set(cacheKey, fsEntry.data, 30 * 60 * 1000, 24 * 60 * 60 * 1000);
    if (fsEntry.isStale) void triggerBackgroundRevalidation();
    return fsEntry.data;
  }

  const bgPromise = triggerBackgroundRevalidation();
  const live = await Promise.race([
    bgPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
  ]);
  if (live) return live;

  return {
    featured: SAMPLE_CATALOG.filter(i => i.isFeatured),
    latestMovies: SAMPLE_CATALOG.filter(i => i.type === 'movie').slice(0, 20),
    latestSeries: SAMPLE_CATALOG.filter(i => i.type === 'series').slice(0, 20),
    trending: SAMPLE_CATALOG.slice(0, 20),
  };
}

// ============ Catalog ============

function getAkwamCategoryUrl(category: string, page: number): string {
  switch (category) {
    case 'arabic-movies': return `${BASE_URL}/movies?section=29&page=${page}`;
    case 'foreign-movies': return `${BASE_URL}/movies?section=30&page=${page}`;
    case 'arabic-series': return `${BASE_URL}/series?section=33&page=${page}`;
    case 'foreign-series': return `${BASE_URL}/series?section=31&page=${page}`;
    case 'turkish-series': return `${BASE_URL}/series?section=32&page=${page}`;
    case 'anime': return `${BASE_URL}/series?section=34&page=${page}`;
    default: return `${BASE_URL}/movies?page=${page}`;
  }
}

export async function getCatalogItems(
  category: string = 'all',
  page: number = 1
): Promise<{ items: MediaItem[]; hasMore: boolean; total: number }> {
  const cacheKey = `cat_${category}_p${page}`;
  const cached = catalogQueryCache.get(cacheKey);
  if (cached) return cached;

  try {
    const targetUrl = getAkwamCategoryUrl(category, page);
    const defaultType = category.includes('series') ? 'series' : 'movie';
    const $ = await fetchHTML(targetUrl, STANDARD_TIMEOUT_MS);

    if ($) {
      const scraped = parseEntryBoxes($, defaultType);
      if (scraped.length > 0) {
        const result = { items: scraped, hasMore: scraped.length >= 12, total: 100 };
        catalogQueryCache.set(cacheKey, result, 60 * 60 * 1000);
        return result;
      }
    }
  } catch (error) {
    console.warn('Catalog scraping note:', error);
  }

  let filtered = SAMPLE_CATALOG;
  if (category && category !== 'all') filtered = SAMPLE_CATALOG.filter(i => i.category === category);

  const startIndex = (page - 1) * 12;
  const items = filtered.slice(startIndex, startIndex + 12);
  return {
    items,                                              // empty past last page — no fake page-1 fallback
    hasMore: startIndex + items.length < filtered.length,
    total: filtered.length,
  };
}

// ============ Search ============

export async function searchMedia(query: string): Promise<MediaItem[]> {
  const qClean = query.trim().toLowerCase();
  if (!qClean) return [];

  const cacheKey = `search_${qClean}`;
  const cached = searchMemoryCache.get(cacheKey);
  if (cached) return cached;

  let liveResults: MediaItem[] = [];
  try {
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(qClean)}`;
    const $ = await fetchHTML(searchUrl, STANDARD_TIMEOUT_MS);
    if ($) liveResults = parseEntryBoxes($);
  } catch (err) {
    console.warn('Search query error:', err);
  }

  const sampleMatches = SAMPLE_CATALOG.filter(item =>
    item.title.toLowerCase().includes(qClean) ||
    item.story.toLowerCase().includes(qClean) ||
    item.genres.some(g => g.toLowerCase().includes(qClean))
  );

  const seenIds = new Set<string>();
  const combined: MediaItem[] = [];
  for (const item of [...liveResults, ...sampleMatches]) {
    if (!seenIds.has(item.id)) { seenIds.add(item.id); combined.push(item); }
  }

  searchMemoryCache.set(cacheKey, combined, 30 * 60 * 1000);
  return combined;
}

function parseEpisodesFromDom($: cheerio.CheerioAPI, currentPageUrl: string): EpisodeItem[] {
  const episodes: EpisodeItem[] = [];
  const seenUrls = new Set<string>();
  const candidates: { href: string; title: string }[] = [];

  $('.entry-box, .widget-body .col-lg-3, .widget-body .col-md-6, .widget-body .col-sm-6, .widget-body .col-12, .episodes-list .episode-box, .widget-body .box').each((_, el) => {
    const box = $(el);
    const linkEl = box.find('a[href*="/episode/"], a[href*="/series/"], a.box, h3 a, h2 a, a').first();
    const href = linkEl.attr('href') || box.attr('href') || '';
    if (!href) return;

    const absUrl = normalizeUrl(href);
    if (!absUrl || absUrl === currentPageUrl) return;
    if (seenUrls.has(absUrl)) return;
    if (absUrl.includes('/category/') || absUrl.includes('/search') || absUrl.includes('/movies')) return;

    const titleText = box.find('.entry-title, h3, h2, span, .title').text().trim() || linkEl.text().trim() || box.text().trim();
    if (!titleText) return;

    seenUrls.add(absUrl);
    candidates.push({ href: absUrl, title: titleText });
  });

  if (candidates.length === 0) {
    $('a[href*="/episode/"], a[href*="/series/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href) return;

      const absUrl = normalizeUrl(href);
      if (!absUrl || absUrl === currentPageUrl) return;
      if (seenUrls.has(absUrl)) return;
      if (absUrl.includes('/category/') || absUrl.includes('/search') || absUrl.includes('/movies')) return;

      const titleText = $(el).text().replace(/\s+/g, ' ').trim();
      if (!titleText || titleText.length < 2) return;

      seenUrls.add(absUrl);
      candidates.push({ href: absUrl, title: titleText });
    });
  }

  candidates.forEach((cand, idx) => {
    let epNum = idx + 1;
    const numMatch = cand.title.match(/(?:حلقة|الحلقة|ep|episode)\s*(\d+)/i) ||
                     cand.href.match(/(?:episode|series|\bep\b)[^/]*?(\d+)/i) ||
                     cand.title.match(/(\d+)/);

    if (numMatch && numMatch[1]) {
      const parsed = parseInt(numMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 2000) {
        epNum = parsed;
      }
    }

    const relPath = cand.href.replace(BASE_URL, '').replace(/^\/+/, '');
    const epId = encodeId(relPath);

    let cleanTitle = cand.title.replace(/\s+/g, ' ').trim();
    if (!cleanTitle || cleanTitle.length > 60 || !cleanTitle.includes('حلقة')) {
      cleanTitle = `الحلقة ${epNum}`;
    }

    episodes.push({
      id: epId,
      number: epNum,
      title: cleanTitle,
      url: `/watch?id=${encodeURIComponent(epId)}`,
      servers: [],
    });
  });

  episodes.sort((a, b) => a.number - b.number);

  const uniqueEpisodes: EpisodeItem[] = [];
  const seenNums = new Set<number>();
  for (const ep of episodes) {
    if (!seenNums.has(ep.number)) {
      seenNums.add(ep.number);
      uniqueEpisodes.push(ep);
    }
  }

  return uniqueEpisodes;
}

// ============ Media details ============

export async function getMediaDetails(id: string): Promise<MediaItem | null> {
  const cached = mediaDetailsCache.get(id);
  if (cached) return cached;

  const sampleMatch = SAMPLE_CATALOG.find(i => i.id === id);
  if (sampleMatch) return sampleMatch;

  const decodedPath = decodeId(id);
  if (!decodedPath) return null;

  try {
    const detailUrl = normalizeUrl(`${BASE_URL}/${decodedPath.replace(/^\/+/, '')}`);
    const $ = await fetchHTML(detailUrl, STANDARD_TIMEOUT_MS);
    if (!$) {
      console.warn(`[Diagnostic] Failed to fetch HTML for: ${detailUrl}`);
      return null;
    }
    
    // Log a snippet of the HTML for diagnostic purposes
    const htmlSnippet = $.html().substring(0, 1000);
    console.log(`[Diagnostic] Scraped HTML snippet for ${detailUrl}:`, htmlSnippet);

    const title = $('h1.entry-title, .movie-title, .title').first().text().trim() || 'مشاهدة العمل';
    const imgEl = $('.poster img, .entry-image img, picture img').first();
    let poster = imgEl.attr('data-src') || imgEl.attr('src') || '';
    if (poster && !poster.startsWith('http')) poster = normalizeUrl(poster);

    const story = $('.entry-story, .story, .widget-body p').first().text().trim() ||
      `شاهد الآن ${title} بجودة عالية.`;

    const rating = $('.rating, .label.rating').first().text().replace(/[^\d.]/g, '').trim() || '7.5';
    const year = $('.badge-secondary, .badge-pill').first().text().trim() || '2024';

    const genres: string[] = [];
    $('.badge-light, .badge-pill').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !genres.includes(text) && text !== year) genres.push(text);
    });

    const isSeries = decodedPath.includes('series') || decodedPath.includes('episode') || title.includes('مسلسل') || title.includes('أنمي') || title.includes('انمي');

    const servers = await resolveStreamServers($, detailUrl);
    let episodes = parseEpisodesFromDom($, detailUrl);

    if (decodedPath.includes('episode') || (isSeries && episodes.length === 0)) {
      let parentSeriesUrl = '';
      $('a[href*="/series/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const norm = normalizeUrl(href);
        if (norm && norm !== detailUrl && !norm.includes('/category/') && !norm.includes('/movies')) {
          if (!parentSeriesUrl) parentSeriesUrl = norm;
        }
      });

      if (parentSeriesUrl) {
        const $parent = await fetchHTML(parentSeriesUrl, STANDARD_TIMEOUT_MS);
        if ($parent) {
          const parentEpisodes = parseEpisodesFromDom($parent, parentSeriesUrl);
          if (parentEpisodes.length > 0) {
            episodes = parentEpisodes;
          }
        }
      }
    }

    let finalServers = servers;
    if (finalServers.length === 0 && episodes.length > 0) {
      const firstEpRelPath = decodeId(episodes[0].id);
      if (firstEpRelPath) {
        const firstEpUrl = normalizeUrl(`${BASE_URL}/${firstEpRelPath.replace(/^\/+/, '')}`);
        const $firstEp = await fetchHTML(firstEpUrl, STANDARD_TIMEOUT_MS);
        if ($firstEp) {
          const epServers = await resolveStreamServers($firstEp, firstEpUrl);
          if (epServers.length > 0) {
            finalServers = epServers;
            episodes[0].servers = epServers;
          }
        }
      }
    }

    const item: MediaItem = {
      id,
      title,
      poster: poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
      story,
      rating,
      year,
      category: isSeries ? 'arabic-series' : 'arabic-movies',
      categoryLabel: isSeries ? 'مسلسلات' : 'أفلام',
      type: isSeries ? 'series' : 'movie',
      genres: genres.length > 0 ? genres : ['أكشن', 'دراما'],
      servers: finalServers,
      episodes: episodes.length > 0 ? episodes : undefined,
    };

    mediaDetailsCache.set(id, item, 4 * 60 * 60 * 1000);
    if (finalServers.length > 0) videoStreamsCache.set(id, finalServers, 45 * 60 * 1000);
    return item;
  } catch (error) {
    console.warn('Media detail scrape note:', error);
  }

  return null;
}

// ============ Grab links ============

export async function grabLinks(targetUrl: string): Promise<LinkGrabberResult | null> {
  try {
    const url = normalizeUrl(targetUrl);
    const $ = await fetchHTML(url, STANDARD_TIMEOUT_MS);
    if (!$) return null;

    const title = $('h1.entry-title, .title').first().text().trim() || 'روابط التحميل والمشاهدة';
    const servers = await resolveStreamServers($, url);

    return {
      title,
      originalUrl: url,
      files: servers.map(s => ({
        quality: `${s.quality}p`,
        size: '—',
        downloadUrl: s.url,
        watchUrl: s.url,
      })),
      streamServers: servers,
    };
  } catch {
    return null;
  }
}

// ============ Deep crawl ============

export interface DeepCrawlResult {
  title: string;
  poster: string;
  source_url: string;
  type: 'movie' | 'series';
  qualities: string[];
  files: Array<{
    quality: string;
    filename: string;
    direct_url: string;
    proxy_url: string;
    size: string;
  }>;
  episodes?: Array<{
    id: string;
    number: number;
    title: string;
    url: string;
  }> | null;
}

export async function deepCrawlTargetPage(urlOrQuery: string): Promise<DeepCrawlResult> {
  let details: MediaItem | null = null;
  if (urlOrQuery.includes('/')) {
    details = await getMediaDetails(urlOrQuery);
  } else {
    const searchResults = await searchMedia(urlOrQuery);
    if (searchResults.length > 0) {
      details = await getMediaDetails(searchResults[0].id) ?? searchResults[0];
    }
  }

  const servers = details?.servers ?? [];

  return {
    title: details?.title || urlOrQuery || 'عمل مجهول',
    poster: details?.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
    source_url: urlOrQuery,
    type: details?.type || 'movie',
    qualities: servers.map(s => `${s.quality}p`),
    files: servers.map(s => ({
      quality: `${s.quality}p`,
      filename: s.name,
      direct_url: s.url,
      proxy_url: `/api/proxy/video?url=${encodeURIComponent(s.url)}`,
      size: '—',
    })),
    episodes: details?.episodes?.map(e => ({
      id: e.id,
      number: e.number,
      title: e.title,
      url: e.url,
    })) || null,
  };
}