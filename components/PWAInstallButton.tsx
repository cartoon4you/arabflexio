'use client';

import React, { useState } from 'react';
import { Download, Share, X, Smartphone, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export const PWAInstallButton: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={() => void install()}
        className={`flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 ${
          compact ? 'px-3 py-1.5' : 'px-4 py-2'
        } ${className}`}
        title="تثبيت تطبيق ArabFlex على جهازك"
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all ${
            compact ? 'px-3 py-1.5' : 'px-4 py-2'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-right" dir="rtl">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Smartphone className="w-5 h-5" />
                  <span>تثبيت ArabFlex على آيفون / آيباد</span>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/60 border border-white/5">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">1. اضغط على زر المشاركة</span>
                    <span>في أسفل متصفح Safari على جهازك.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/60 border border-white/5">
                  <div className="p-1.5 rounded-lg bg-green-500/20 text-green-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">2. اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</span>
                    <span>(Add to Home Screen) من القائمة.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md"
              >
                فهمت، إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
