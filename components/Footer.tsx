import React from 'react';
import Link from 'next/link';
import { Film, Shield, Zap, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#070A11] text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-white">
                يمن<span className="text-amber-500">فلکس</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
              منصة يمن فلکس الرقمية لمتابعة أحدث الأفلام والمسلسلات العربية والتركية والأجنبية والأنمي بجودات متعددة وسيرفرات مباشرة سريعة مصممة لراحة المشاهد في الوطن العربي.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-amber-500" /> سيرفرات آمنة</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> بث فائق السرعة</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">الأقسام الرئيسية</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/catalog?category=arabic-movies" className="hover:text-amber-400">أفلام عربية</Link></li>
              <li><Link href="/catalog?category=foreign-movies" className="hover:text-amber-400">أفلام أجنبية</Link></li>
              <li><Link href="/catalog?category=turkish-series" className="hover:text-amber-400">مسلسلات تركية</Link></li>
              <li><Link href="/catalog?category=arabic-series" className="hover:text-amber-400">مسلسلات عربية</Link></li>
              <li><Link href="/catalog?category=anime" className="hover:text-amber-400">أنمي مترجم</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">أدوات إضافية</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/worldcinema" className="hover:text-amber-400">سينما عالمية</Link></li>
              <li><Link href="/linkgrabber" className="hover:text-amber-400">مستخرج الروابط المباشرة</Link></li>
              <li><Link href="/watchlist" className="hover:text-amber-400">قائمة المشاهدة المفضلة</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} يمن فلکس (Yemenflex). جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">
            صنع بـ <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> لعشاق السينما
          </p>
        </div>
      </div>
    </footer>
  );
}
