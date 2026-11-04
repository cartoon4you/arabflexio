import { NextRequest } from 'next/server';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Readable } from 'stream';
import { invalidateStreams } from '@/lib/scraper-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ⚡ الأهم: Agent معاد الاستخدام مع Connection Pooling — يقضي على handshake في كل طلب Range
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 128,
  maxFreeSockets: 32,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 128,
  maxFreeSockets: 32,
  rejectUnauthorized: false,
});

const UPSTREAM_TIMEOUT_MS = Number(process.env.STREAM_UPSTREAM_TIMEOUT_MS ?? 30000);

interface UpstreamResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  stream: Readable;
}

function fetchUpstream(
  targetUrl: string,
  baseHeaders: Record<string, string>,
  originalReferer: string,
  maxRedirects = 5,
  startTime = Date.now(),
  method = 'GET'
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    if (Date.now() - startTime > UPSTREAM_TIMEOUT_MS) {
      return reject(new Error('Upstream global timeout'));
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return reject(e);
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const activeHeaders: Record<string, string> = {
      ...baseHeaders,
      Host: parsedUrl.host,
    };
    // 🔑 احتفظ بالـ Referer الأصلي دائماً عبر جميع الـ redirects
    if (originalReferer) {
      activeHeaders['Referer'] = originalReferer;
    }

    const req = client.request(
      targetUrl,
      {
        method,
        headers: activeHeaders,
        agent,
        timeout: Math.max(2000, UPSTREAM_TIMEOUT_MS - (Date.now() - startTime)),
      },
      (res) => {
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          maxRedirects > 0
        ) {
          const redirectUrl = new URL(res.headers.location, targetUrl).toString();
          res.resume();
          return fetchUpstream(
            redirectUrl,
            baseHeaders,
            originalReferer, // ⬅️ الحفاظ على Referer الأصلي لمنع الحظر
            maxRedirects - 1,
            startTime,
            method
          )
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode && res.statusCode >= 400) {
          res.resume();

          // If upstream returns 5xx (e.g. 500 Internal Server Error) and Range was requested,
          // automatically retry once without Range header (some CDN nodes fail on byte-range requests)
          if (res.statusCode >= 500 && baseHeaders['Range']) {
            const noRangeHeaders = { ...baseHeaders };
            delete noRangeHeaders['Range'];
            return fetchUpstream(
              targetUrl,
              noRangeHeaders,
              originalReferer,
              maxRedirects,
              startTime,
              method
            )
              .then(resolve)
              .catch(reject);
          }

          // If upstream returns 5xx and referer was sent, retry once without referer
          if (res.statusCode >= 500 && originalReferer) {
            return fetchUpstream(
              targetUrl,
              baseHeaders,
              '',
              maxRedirects,
              startTime,
              method
            )
              .then(resolve)
              .catch(reject);
          }

          return reject(new Error(`Upstream HTTP ${res.statusCode}`));
        }

        const cType = String(res.headers['content-type'] || '').toLowerCase();
        if (cType.includes('text/html') || cType.includes('application/json')) {
          res.resume();
          return reject(new Error('Upstream returned non-video content'));
        }

        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          stream: res,
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error('Socket timeout')));
    req.on('error', (err) => reject(err));
    req.end();
  });
}

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get('url');
  const refererParam = request.nextUrl.searchParams.get('referer') ?? '';
  const mediaIdParam = request.nextUrl.searchParams.get('mediaId') || request.nextUrl.searchParams.get('id') || '';

  if (!videoUrl) {
    return jsonError(400, 'المعامل url مفقود');
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(videoUrl);
  } catch {
    return jsonError(400, 'صيغة الرابط غير صحيحة');
  }

  // Allow-list check
  const allowedHostsStr = process.env.STREAM_ALLOWED_HOSTS;
  if (allowedHostsStr) {
    const allowedHosts = allowedHostsStr.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
    if (allowedHosts.length > 0) {
      const targetHost = parsedTarget.hostname.toLowerCase();
      const isKnownMediaCdn =
        targetHost.endsWith('.downet.net') ||
        targetHost === 'downet.net' ||
        targetHost.endsWith('.akwam.ss') ||
        targetHost === 'akwam.ss' ||
        targetHost.includes('zencdn.net') ||
        targetHost.includes('w3.org') ||
        targetHost.includes('mozilla.net') ||
        targetHost.includes('mux.dev');

      const isAllowed =
        isKnownMediaCdn ||
        allowedHosts.some((allowed) => {
          const cleanAllowed = allowed.startsWith('.') ? allowed.slice(1) : allowed;
          return targetHost === cleanAllowed || targetHost.endsWith(`.${cleanAllowed}`);
        });

      if (!isAllowed) return jsonError(403, `النطاق ${targetHost} غير مسموح به`);
    }
  }

  try {
    // 🔑 استخدم referer المرسل من العميل أولاً
    let effectiveReferer = refererParam;
    if (!effectiveReferer) {
      const baseUrl = process.env.AKWAM_BASE_URL || 'https://akwam.ss';
      try {
        effectiveReferer = `${new URL(baseUrl).origin}/`;
      } catch {
        effectiveReferer = 'https://akwam.ss/';
      }
    }

    const rangeHeader = request.headers.get('range');
    const userAgent =
      process.env.SCRAPER_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    const headersToSend: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'identity', // مهم لحساب Range بدقة
      'Connection': 'keep-alive',
    };

    if (rangeHeader) headersToSend['Range'] = rangeHeader;

    const { statusCode, headers: upstreamHeaders, stream } = await fetchUpstream(
      videoUrl,
      headersToSend,
      effectiveReferer
    );

    if (request.signal) {
      if (request.signal.aborted) stream.destroy();
      else {
        request.signal.addEventListener('abort', () => {
          try {
            stream.destroy();
          } catch {}
        });
      }
    }

    // Content-Type
    let contentType = upstreamHeaders['content-type'] as string | undefined;
    const lowerUrl = videoUrl.toLowerCase();
    if (!contentType || contentType === 'application/octet-stream' || contentType === 'video/x-matroska') {
      if (lowerUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
      else if (lowerUrl.includes('.webm')) contentType = 'video/webm';
      else contentType = 'video/mp4';
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    if (upstreamHeaders['content-length']) {
      responseHeaders.set('Content-Length', String(upstreamHeaders['content-length']));
    }
    if (upstreamHeaders['content-range']) {
      responseHeaders.set('Content-Range', String(upstreamHeaders['content-range']));
    }

    // HLS playlist rewrite
    const isM3U8 = (contentType && contentType.includes('mpegurl')) || lowerUrl.includes('.m3u8');
    if (isM3U8) {
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) chunks.push(chunk as Uint8Array);
      const playlistText = Buffer.concat(chunks).toString('utf-8');
      const baseObj = new URL(videoUrl);
      const mediaIdQuery = mediaIdParam ? `&mediaId=${encodeURIComponent(mediaIdParam)}` : '';
      const rewritten = playlistText
        .split('\n')
        .map((line) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return line;
          try {
            const abs = new URL(t, baseObj).toString();
            return `/api/proxy/video?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(effectiveReferer)}${mediaIdQuery}`;
          } catch {
            return line;
          }
        })
        .join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(rewritten, { status: statusCode, headers: responseHeaders });
    }

    // 🚀 إرجاع الـ stream — لا انتظار ولا buffering
    const webStream = Readable.toWeb(stream) as ReadableStream;
    return new Response(webStream, { status: statusCode, headers: responseHeaders });
  } catch (error: any) {
    console.warn('[Proxy] Upstream video server response:', error?.message || error);
    const is403 = /403/i.test(error?.message || '');
    if (is403 && mediaIdParam) {
      console.warn(`[Proxy] Received 403 from upstream. Invalidating stream cache for ${mediaIdParam}`);
      invalidateStreams(mediaIdParam);
    }
    const isTimeout = /timeout|مهلة|AbortError/i.test(error?.message || '');
    return jsonError(
      is403 ? 403 : (isTimeout ? 504 : 502),
      is403 ? 'عفواً، انتهت صلاحية رابط البث المؤقت' : (isTimeout ? 'انتهت مهلة السيرفر المصدر' : 'السيرفر المصدر غير متاح حالياً'),
      error?.message
    );
  }
}

export async function HEAD(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get('url');
  const refererParam = request.nextUrl.searchParams.get('referer') ?? '';

  if (!videoUrl) return new Response(null, { status: 400 });

  try {
    let effectiveReferer = refererParam;
    if (!effectiveReferer) {
      const baseUrl = process.env.AKWAM_BASE_URL || 'https://akwam.ss';
      try {
        effectiveReferer = `${new URL(baseUrl).origin}/`;
      } catch {
        effectiveReferer = 'https://akwam.ss/';
      }
    }

    const { statusCode, headers: upstreamHeaders, stream } = await fetchUpstream(
      videoUrl,
      {
        'User-Agent':
          process.env.SCRAPER_USER_AGENT ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      effectiveReferer,
      5,
      Date.now(),
      'HEAD'
    );
    stream.destroy();

    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (upstreamHeaders['content-type']) responseHeaders.set('Content-Type', upstreamHeaders['content-type']);
    if (upstreamHeaders['content-length']) responseHeaders.set('Content-Length', String(upstreamHeaders['content-length']));

    return new Response(null, { status: statusCode, headers: responseHeaders });
  } catch {
    return new Response(null, { status: 502 });
  }
}

function jsonError(status: number, message: string, details?: string) {
  return new Response(JSON.stringify({ success: false, error: message, details }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
    },
  });
}