'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, Bookmark, Play, Check, Zap } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { preloadImage, preloadMediaDetails, setCachedMediaDetails } from '@/lib/preload-manager';

interface MediaCardProps {
  item: MediaItem;
}

export default function MediaCard({ item }: MediaCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const saved = isInWatchlist(item.id);

  // 1. Viewport Anticipation: Preload poster and register cache item immediately
  useEffect(() => {
    // Seed media basic data into client cache for 0ms watch page load
    setCachedMediaDetails(item.id, item);

    const cardEl = cardRef.current;
    if (!cardEl || !item.poster || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          preloadImage(item.poster, 'auto');
          router.prefetch(`/watch?id=${encodeURIComponent(item.id)}`);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [item, router]);

  // 2. Hover / Touch Interaction Preloading (Warm up Watch Page & Video Chunks)
  const handleInteractionPreload = () => {
    setCachedMediaDetails(item.id, item);
    router.prefetch(`/watch?id=${encodeURIComponent(item.id)}`);

    if (item.poster) preloadImage(item.poster, 'high');
    if (item.banner) preloadImage(item.banner, 'auto');

    preloadMediaDetails(item.id);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(item);
    }
  };

  return (
    <div
      ref={cardRef}
      id={`media-card-${item.id}`}
      onMouseEnter={handleInteractionPreload}
      onTouchStart={handleInteractionPreload}
      onFocus={handleInteractionPreload}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-neutral-900/80 border border-neutral-800/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-red-600/50 hover:shadow-xl hover:shadow-red-950/20"
      dir="rtl"
    >
      <Link
        href={`/watch?id=${encodeURIComponent(item.id)}`}
        prefetch={true}
        className="block relative aspect-[2/3] w-full overflow-hidden bg-neutral-950"
      >
        {/* Placeholder skeleton while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-900/90 animate-pulse flex items-center justify-center">
            <Zap className="w-5 h-5 text-neutral-700 animate-bounce" />
          </div>
        )}

        <Image
          src={item.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600'}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity"></div>

        {/* Top Badges: Rating & Quality */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {item.rating && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-neutral-700/60 text-xs font-bold text-amber-400 font-mono">
              <Star className="w-3 h-3 fill-amber-400" />
              {item.rating}
            </span>
          )}

          <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-[10px] font-bold text-white font-mono uppercase tracking-wider">
            {item.type === 'series' ? 'مسلسل' : 'فيلم'}
          </span>
        </div>

        {/* Center Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl shadow-red-950 scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-white translate-x-0.5" />
          </div>
        </div>

        {/* Watchlist Quick Button with Touch Friendly Sizing */}
        <button
          type="button"
          id={`watchlist-toggle-${item.id}`}
          onClick={handleWatchlistClick}
          aria-label={saved ? 'إزالة من قائمتي' : 'إضافة إلى قائمتي'}
          className={`absolute bottom-2.5 left-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl backdrop-blur-md border transition-transform active:scale-90 cursor-pointer ${
            saved
              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
              : 'bg-black/70 text-neutral-300 hover:text-white border-neutral-700/60 hover:bg-neutral-800'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </Link>

      {/* Info Section */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <Link
            href={`/watch?id=${encodeURIComponent(item.id)}`}
            prefetch={false}
            onMouseEnter={handleInteractionPreload}
            className="block text-xs sm:text-sm font-bold text-neutral-100 hover:text-red-500 transition line-clamp-1 leading-snug"
          >
            {item.title}
          </Link>
          {item.originalTitle && (
            <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate font-mono mt-0.5">
              {item.originalTitle}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] sm:text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
          <span>{item.year || '2024'}</span>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">
            {item.categoryLabel || (item.type === 'series' ? 'مسلسلات' : 'أفلام')}
          </span>
        </div>
      </div>
    </div>
  );
}

