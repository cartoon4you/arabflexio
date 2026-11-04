'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Watch Page Error:', error);
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk');

    if (isChunkError) {
      const reloadKey = 'watch_chunk_error_' + (typeof window !== 'undefined' ? window.location.search : '');
      if (typeof window !== 'undefined' && !sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk')
    ) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto" dir="rtl">
      <div className="p-4 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 mb-4">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">تعذر تحميل مشغل الفيديو</h1>
      <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
        حدث انقطاع مؤقت أثناء تحميل مكونات المشغل. يرجى الضغط على زر إعادة التحميل لتشغيل العرض.
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-red-600/30"
        >
          إعادة تحميل المشغل
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-sm font-semibold transition border border-neutral-800"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
