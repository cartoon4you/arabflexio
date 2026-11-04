'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, Bookmark, Home, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2 animate-pulse">
        <WifiOff className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white">أنت تعمل الآن بدون اتصال بالإنترنت</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          تعذّر الاتصال بالخادم. يمكنك تصفح قائمتك المفضلة المحفوظة محلياً أو المحاولة مرة أخرى عند توفر الاتصال.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Link
          href="/watchlist"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all"
        >
          <Bookmark className="w-4 h-4" />
          <span>تصفح قائمة المشاهدة المحفوظة</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-white/10 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
      </div>

      <div className="pt-8">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة الآن</span>
        </button>
      </div>
    </div>
  );
}
