import React from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-24 px-4 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto text-amber-500">
        <Film className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-white">404</h1>
      <h2 className="text-lg font-bold text-zinc-200">الصفحة المطلوبة غير موجودة</h2>
      <p className="text-xs text-zinc-400">
        ربما تم حذف العمل أو تم تغيير رابطه. يمكنك البحث عنه أو العودة للرئيسية.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
