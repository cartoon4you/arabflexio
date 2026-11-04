'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Bookmark, Star, ChevronLeft, ChevronRight, Check, Sparkles, Zap } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { preloadImage, preloadMediaDetails, setCachedMediaDetails } from '@/lib/preload-manager';

interface HeroSliderProps {
  items: MediaItem[];
}

export default function HeroSlider({ items }: HeroSliderProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const slides = useMemo(() => (items && items.length > 0 ? items : []), [items]);
  const current = slides[currentIndex] || null;
  const saved = current ? isInWatchlist(current.id) : false;

  // Seed all slides into cache for instant opening
  useEffect(() => {
    slides.forEach((item) => {
      setCachedMediaDetails(item.id, item);
      router.prefetch(`/watch?id=${encodeURIComponent(item.id)}`);
    });
  }, [slides, router]);

  const handleWarmWatch = useCallback(() => {
    if (!current) return;
    setCachedMediaDetails(current.id, current);
    router.prefetch(`/watch?id=${encodeURIComponent(current.id)}`);
    preloadMediaDetails(current.id);
  }, [current, router]);

  // Predictive Preloading: Preload the next & previous slide images and current video stream
  useEffect(() => {
    if (slides.length === 0) return;

    const currentItem = slides[currentIndex];
    const nextItem = slides[(currentIndex + 1) % slides.length];
    const prevItem = slides[(currentIndex - 1 + slides.length) % slides.length];

    // Preload adjacent slide backdrops immediately
    if (nextItem?.banner || nextItem?.poster) {
      preloadImage(nextItem.banner || nextItem.poster, 'high');
    }
    if (prevItem?.banner || prevItem?.poster) {
      preloadImage(prevItem.banner || prevItem.poster, 'auto');
    }

    // Preload current slide's video and watch details in the background
    if (currentItem) {
      preloadMediaDetails(currentItem.id);

    }
  }, [currentIndex, slides]);

  // Auto rotate slides every 6 seconds unless paused
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (slides.length === 0 || !current) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    // Minimum swipe threshold of 45px
    if (Math.abs(diffX) > 45) {
      if (diffX > 0) {
        // Swiped left (in RTL: goes to next or prev)
        nextSlide();
      } else {
        // Swiped right
        prevSlide();
      }
    }
    setTouchStartX(null);
    setIsPaused(false);
  };

  const handleWatchlistToggle = () => {
    if (saved) {
      removeFromWatchlist(current.id);
    } else {
      addToWatchlist(current);
    }
  };

  return (
    <div
      id="hero-carousel-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[480px] sm:h-[580px] lg:h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-2xl select-none"
      dir="rtl"
    >
      {/* Background Backdrop Image with smooth fade */}
      <div className="absolute inset-0">
        <Image
          key={current.id}
          src={current.banner || current.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280'}
          alt={current.title}
          fill
          priority={true}
          sizes="100vw"
          referrerPolicy="no-referrer"
          className="object-cover object-center scale-105 transition-all duration-1000 ease-out brightness-90 animate-in fade-in zoom-in-95 duration-700"
        />
        {/* Layered Cinematic Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-neutral-950/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/50 to-transparent"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-12 flex flex-col justify-end pb-16 sm:pb-16 pt-16 sm:pt-24">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {/* Top Badges */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] sm:text-xs font-bold shadow-lg shadow-red-900/40">
              <Sparkles className="w-3.5 h-3.5" />
              أحدث العروض الحصرية
            </span>

            {current.rating && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700 text-xs font-bold text-amber-400 font-mono">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {current.rating} IMDb
              </span>
            )}

            <span className="px-2 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-xs text-neutral-300 font-mono">
              {current.year}
            </span>

            {current.duration && (
              <span className="px-2 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-xs text-neutral-300">
                {current.duration}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-2">
            {current.title}
          </h1>

          {/* Genres Chips */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {current.genres.slice(0, 4).map((g, idx) => (
                <span
                  key={idx}
                  className="px-2 sm:px-2.5 py-0.5 rounded-lg bg-neutral-800/80 text-[11px] sm:text-xs text-neutral-300 border border-neutral-700/50"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          <p className="text-xs sm:text-base text-neutral-300 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl drop-shadow">
            {current.story}
          </p>

          {/* Actions: Watch Now & Add to Watchlist */}
          <div className="pt-1 sm:pt-2 flex items-center flex-wrap gap-2.5 sm:gap-3">
            <Link
              href={`/watch?id=${encodeURIComponent(current.id)}`}
              prefetch={false}
              id="hero-watch-now-btn"
              onMouseEnter={handleWarmWatch}
              onTouchStart={handleWarmWatch}
              onFocus={handleWarmWatch}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 transition flex-1 sm:flex-initial"
            >
              <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-white translate-x-0.5" />
              <span>مشاهدة الآن</span>
            </Link>

            <button
              type="button"
              id="hero-watchlist-btn"
              onClick={handleWatchlistToggle}
              className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-3 min-h-[44px] rounded-xl backdrop-blur-md border font-medium text-xs sm:text-sm transition active:scale-95 ${
                saved
                  ? 'bg-neutral-800 text-white border-neutral-600'
                  : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border-neutral-700/70 hover:text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>في قائمتك</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-red-500" />
                  <span>إضافة لقائمتي</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Controls: Arrows & Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-12 z-20 flex items-center gap-2 sm:gap-3">
        {/* Indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`شريحة ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-6 sm:w-8 bg-red-600' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
              }`}
            />
          ))}
        </div>

        {/* Previous / Next Arrow Buttons */}
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="السابق"
            className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-800 backdrop-blur-md transition active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="التالي"
            className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-800 backdrop-blur-md transition active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
