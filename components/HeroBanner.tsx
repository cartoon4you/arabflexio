'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Bookmark, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useWatchlist } from '@/contexts/WatchlistContext';

interface HeroBannerProps {
  items: MediaItem[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const featured = items && items.length > 0 ? items.slice(0, 5) : [];

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (featured.length === 0) return null;

  const current = featured[currentIndex];
  const bookmarked = isInWatchlist(current.id);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeFromWatchlist(current.id);
    } else {
      addToWatchlist(current);
    }
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[640px] overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <Image
          src={current.poster}
          alt={current.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 filter blur-xs brightness-75 transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19] via-[#0B0F19]/80 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-md">
              مميز يمن فلکس
            </span>
            <span className="bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-white/10">
              {current.type === 'series' ? 'مسلسل' : 'فيلم'}
            </span>
            {current.rating && (
              <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md border border-white/10">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {current.rating}
              </span>
            )}
            <span className="text-zinc-300 text-xs">{current.year}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {current.title}
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 leading-relaxed drop-shadow">
            {current.story}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {current.genres?.map((genre) => (
              <span
                key={genre}
                className="text-xs text-zinc-400 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href={`/watch?id=${current.id}`}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>مشاهدة الآن</span>
            </Link>

            <button
              onClick={toggleBookmark}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium border backdrop-blur-md transition-all ${
                bookmarked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              <span>{bookmarked ? 'في المفضلة' : 'أضف لقائمتي'}</span>
            </button>

            <Link
              href={`/watch?id=${current.id}`}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-zinc-300 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>التفاصيل</span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-4 sm:left-8 flex items-center gap-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 transition-all rounded-full ${
                idx === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`شريحة ${idx + 1}`}
            />
          ))}
          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length)}
              className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featured.length)}
              className="p-1 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
