'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/90 backdrop-blur-md text-black font-bold text-xs shadow-2xl border border-amber-400/40 animate-bounce"
      dir="rtl"
    >
      <div className="p-1.5 rounded-lg bg-black/10">
        <WifiOff className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span>أنت تعمل الآن بدون اتصال (Offline)</span>
        <span className="text-[10px] opacity-80 font-normal">يتم عرض البيانات والصفحات المخزنة مؤقتاً</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="p-1 rounded-lg bg-black/10 hover:bg-black/20 transition-colors mr-1"
        title="إعادة التحميل"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
