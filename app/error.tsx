'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error:', error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-white">حدث خطأ غير متوقع</h2>
      <p className="text-xs text-zinc-400">
        واجه الخادم مشكلة مؤقتة أثناء جلب المحتوى. يمكنك إعادة المحاولة الآن.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/10"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
