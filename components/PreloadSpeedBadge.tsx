'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Activity, Check, RefreshCw, X, ShieldCheck } from 'lucide-react';
import {
  getPreloadStats,
  subscribePreloadStats,
  isPreloadEnabled,
  setPreloadEnabled,
} from '@/lib/preload-manager';

export default function PreloadSpeedBadge() {
  const [stats, setStats] = useState(getPreloadStats);
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => (typeof window !== 'undefined' ? isPreloadEnabled() : true));
  const [justCleared, setJustCleared] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePreloadStats((newStats) => {
      setStats(newStats);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    setPreloadEnabled(nextState);
  };

  const handleClear = () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    setJustCleared(true);
    setTimeout(() => setJustCleared(false), 2000);
  };

  const totalPreloaded = stats.imagesPreloaded + stats.videosPreloaded + stats.detailsPreloaded;

  return (
    <>
      {/* Navbar / Floating Trigger Pill */}
      <button
        type="button"
        id="preload-turbo-trigger"
        onClick={() => setIsOpen(true)}
        title="ميزة السرعة والتحميل المسبق (Turbo Preload)"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
          enabled
            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-950/20'
            : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-neutral-200'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {enabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              enabled ? 'bg-amber-500' : 'bg-neutral-500'
            }`}
          ></span>
        </span>
        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span className="hidden sm:inline">تسريع وتوربو</span>
        <span className="text-[11px] font-mono px-1 rounded bg-black/40 text-amber-300">
          {totalPreloaded}
        </span>
      </button>

      {/* Interactive Modal Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-100 flex items-center gap-1.5">
                    التحميل المسبق فائق السرعة
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      PRELOAD TURBO
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    تقنية ذكية لتسريع ظهور بوسترات الأفلام وبدء تشغيل الفيديو فورياً
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Status */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-neutral-200">
                  وضع التسريع الاستباقي (Preload Mode)
                </span>
                <p className="text-[11px] text-neutral-400">
                  {enabled ? 'الميزة مفعّلة لتقديم أقصى سرعة استجابة' : 'الميزة متوقفة لتوفير استهلاك البيانات'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  enabled ? 'bg-amber-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? '-translate-x-6' : '-translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Live Stats Counters */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center space-y-1">
                <span className="text-xs text-neutral-400 block">بوسترات جاهزة</span>
                <span className="text-lg sm:text-xl font-mono font-black text-amber-400">
                  {stats.imagesPreloaded}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center space-y-1">
                <span className="text-xs text-neutral-400 block">فيديوهات مسبقة</span>
                <span className="text-lg sm:text-xl font-mono font-black text-red-500">
                  {stats.videosPreloaded}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-center space-y-1">
                <span className="text-xs text-neutral-400 block">وقت موفّر (تقريبي)</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                  {Math.round(stats.totalSavedMsEstimate / 100) / 10}s
                </span>
              </div>
            </div>

            {/* How it works breakdown */}
            <div className="space-y-2 text-xs text-neutral-300 bg-neutral-950/40 p-3.5 rounded-2xl border border-neutral-800/50">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>تحميل البوسترات قبل الوصول:</strong> يتم جلب صور الأفلام مسبقاً بمجرد اقترابك منها أثناء التمرير في الصفحة.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>تحميل أول 512KB من الفيديو:</strong> عند التمرير بالماوس أو لمس أي فيلم، يتم تجهيز ترويسة الفيديو في كاش المتصفح لتبدأ المشاهدة دون أي انتظار.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>الحلقة التالية التلقائية:</strong> يتم تحميل الحلقة التالية في المسلسلات لتجربة مشاهدة متواصلة وسلسة.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${justCleared ? 'animate-spin' : ''}`} />
                <span>{justCleared ? 'تم تفريغ الذاكرة' : 'تفريغ الكاش المؤقت'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-xs font-bold text-neutral-950 shadow-lg shadow-amber-950/40 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
