'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play, Bookmark } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { useWatchlist } from '@/contexts/WatchlistContext';

interface MovieCardProps {
  item: MediaItem;
}

export function MovieCard({ item }: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const bookmarked = isInWatchlist(item.id);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookmarked) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(item);
    }
  };

  const watchUrl = `/watch?id=${item.id}`;

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
      <Link href={watchUrl} className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <Image
          src={item.poster}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          {item.rating && (
            <span className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold px-2 py-0.5 rounded-md border border-white/10">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {item.rating}
            </span>
          )}
        </div>

        <button
          onClick={toggleBookmark}
          className={`absolute top-2 left-2 z-10 p-1.5 rounded-md backdrop-blur-md transition-colors ${
            bookmarked
              ? 'bg-amber-500 text-black'
              : 'bg-black/60 text-white/80 hover:text-white hover:bg-black/80'
          }`}
          title={bookmarked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 fill-current mr-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-800/80 backdrop-blur-sm text-zinc-300 border border-white/10">
            {item.type === 'series' ? 'مسلسل' : 'فيلم'}
          </span>
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1 justify-between">
        <Link href={watchUrl}>
          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
            {item.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
          <span>{item.year || '2024'}</span>
          <span className="text-[11px] text-zinc-500 line-clamp-1 max-w-[120px]">
            {item.genres?.slice(0, 2).join(' • ') || item.categoryLabel || 'منوع'}
          </span>
        </div>
      </div>
    </div>
  );
}
