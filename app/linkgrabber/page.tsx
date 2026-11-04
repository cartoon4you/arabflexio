'use client';

import React, { useState } from 'react';
import { Download, Link as LinkIcon, Loader2, Play, CheckCircle2, Shield } from 'lucide-react';
import { LinkGrabberResult } from '@/lib/types';

export default function LinkGrabberPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkGrabberResult | null>(null);
  const [error, setError] = useState('');

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/linkgrabber?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        throw new Error('تعذر استخراج الروابط من هذا الرابط');
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء فحص الرابط');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
          <Download className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">مستخرج الروابط المباشرة</h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
          تجاوز الإعلانات وصفحات الانتظار! ضع رابط أي عمل من أكوام واحصل فوراً على روابط المشاهدة والتحميل المباشرة بسرعة قصوى.
        </p>
      </div>

      <form onSubmit={handleExtract} className="space-y-3">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ضع رابط العمل هنا (مثال: https://akwam.ss/movie/1234/...)"
            required
            className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-2xl pl-28 pr-12 py-4 border border-white/10 focus:outline-none focus:border-amber-500 shadow-xl text-sm"
          />
          <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <button
            type="submit"
            disabled={loading}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>استخراج</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                تم الاستخراج بنجاح
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{result.title}</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>جاهز للتحميل</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-300">سيرفرات التحميل المباشرة:</h3>
            <div className="space-y-2">
              {result.files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/60 border border-white/5 hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                      {file.quality}
                    </span>
                    <span className="text-xs text-zinc-400">{file.size}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل مباشر</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-1">
          <Shield className="w-5 h-5 text-amber-500 mb-1" />
          <h4 className="text-xs font-bold text-white">بدون إعلانات مزعجة</h4>
          <p className="text-[11px] text-zinc-400">روابط نظيفة بدون نوافذ منبثقة أو تحويلات مضللة.</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-1">
          <Download className="w-5 h-5 text-amber-500 mb-1" />
          <h4 className="text-xs font-bold text-white">سرعة غير محدودة</h4>
          <p className="text-[11px] text-zinc-400">تحميل واستئناف مباشر بدقة 1080p و 720p و 480p.</p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 space-y-1">
          <Play className="w-5 h-5 text-amber-500 mb-1" />
          <h4 className="text-xs font-bold text-white">دعم المشاهدة الفورية</h4>
          <p className="text-[11px] text-zinc-400">إمكانية تشغيل الروابط في مشغلات خارجية مثل VLC.</p>
        </div>
      </div>
    </div>
  );
}
