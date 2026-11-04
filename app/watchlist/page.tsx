'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, Trash2, Play, Film, Cloud, HardDrive } from 'lucide-react';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useAuth } from '@/contexts/AuthContext';

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, isCloudSynced } = useWatchlist();
  const { currentUser, signInWithGoogle } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-amber-400">الرئيسية</Link>
            <span>/</span>
            <span className="text-amber-400">قائمتي المفضلة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-amber-500 fill-amber-500" />
            قائمة المشاهدة المفضلة
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isCloudSynced ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20">
              <Cloud className="w-3.5 h-3.5" />
              <span>مزامنة سحابية نشطة</span>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-white/10 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>سجل دخول للمزامنة السحابية</span>
            </button>
          )}
        </div>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-white/5 hover:border-amber-500/40 transition-all duration-300"
            >
              <Link href={`/watch?id=${item.id}`} className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                <Image
                  src={item.poster}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current mr-0.5" />
                  </div>
                </div>
              </Link>

              <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <Link href={`/watch?id=${item.id}`}>
                  <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{item.year || '2024'}</span>
                  <button
                    onClick={() => removeFromWatchlist(item.id)}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="إزالة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-4">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">قائمتك فارغة حتى الآن</h3>
            <p className="text-xs text-zinc-400">
              اضغط على أيقونة الإشارة المرجعية على أي فيلم أو مسلسل لحفظه هنا ومشاهدته لاحقاً.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            تصفح أحدث الأعمال
          </Link>
        </div>
      )}
    </div>
  );
}
