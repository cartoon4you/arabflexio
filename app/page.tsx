import React from 'react';
import Link from 'next/link';
import { HeroBanner } from '@/components/HeroBanner';
import { MovieCard } from '@/components/MovieCard';
import { getHomeContent } from '@/lib/scraper-service';
import { CATEGORIES_LIST } from '@/lib/catalog-data';
import { ChevronLeft, Flame, Film, Tv, Sparkles } from 'lucide-react';

export const revalidate = 600;

export default async function HomePage() {
  const { featured, latestMovies, latestSeries, trending } = await getHomeContent();

  return (
    <div className="space-y-12 pb-16">
      <HeroBanner items={featured.length > 0 ? featured : latestMovies} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES_LIST.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900/90 border border-white/5 hover:border-amber-500/40 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {trending && trending.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">الأكثر رواجاً الآن</h2>
              </div>
              <Link
                href="/catalog?category=all"
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trending.slice(0, 10).map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {latestMovies && latestMovies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Film className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">أحدث الأفلام</h2>
              </div>
              <Link
                href="/catalog?category=arabic-movies"
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>المزيد من الأفلام</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {latestMovies.slice(0, 10).map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {latestSeries && latestSeries.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Tv className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">أحدث المسلسلات</h2>
              </div>
              <Link
                href="/catalog?category=arabic-series"
                className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>المزيد من المسلسلات</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {latestSeries.slice(0, 10).map((item) => (
                <MovieCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              تجربة مشاهدة فائقة
            </div>
            <h3 className="text-xl font-bold text-white">أفضل جودة وسيرفرات مباشرة بدون إعلانات</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              تمتع بتشغيل الفيديو بأعلى جودة ودقة 1080p FHD بدون انقطاع مع إمكانية استخراج الروابط المباشرة للتحميل.
            </p>
          </div>
          <Link
            href="/linkgrabber"
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            جرب مستخرج الروابط
          </Link>
        </div>
      </div>
    </div>
  );
}
