'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, Layers, Filter, X } from 'lucide-react';
import { CATEGORIES, ALL_GENRES } from '@/lib/catalog-data';
import { SubCategoryOption } from '@/lib/types';

export default function CatalogFilters({
  activeCategory,
  activeSubcategory,
  activeType,
  activeSort,
}: {
  activeCategory: string;
  activeSubcategory: string;
  activeType: string;
  activeSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Find subcategories for active main category
  const categoryObj = CATEGORIES.find((c) => c.id === activeCategory);
  const availableSubcategories: SubCategoryOption[] = [
    { id: 'all', label: 'الكل' },
    ...(categoryObj?.subcategories || ALL_GENRES.slice(1)),
  ];

  const updateFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === 'all' || !val) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    params.set('page', '1');
    router.push(`/catalog?${params.toString()}`);
  };

  const hasActiveFilters =
    (activeCategory && activeCategory !== 'all') ||
    (activeSubcategory && activeSubcategory !== 'all') ||
    (activeType && activeType !== 'all') ||
    (activeSort && activeSort !== 'latest');

  const handleResetFilters = () => {
    router.push('/catalog');
  };

  return (
    <div className="space-y-4">
      {/* Subcategories / Genres Bar */}
      <div className="bg-neutral-900/80 p-3.5 sm:p-4 rounded-2xl border border-neutral-800/90 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300">
            <Layers className="w-4 h-4 text-red-500" />
            <span>التصنيفات الفرعية والأنواع:</span>
            {activeSubcategory && activeSubcategory !== 'all' && (
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[11px] font-semibold">
                مفلتر حسب: {availableSubcategories.find((s) => s.id === activeSubcategory)?.label || activeSubcategory}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-[11px] font-medium transition active:scale-95 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء الفلاتر</span>
            </button>
          )}
        </div>

        {/* Subcategories Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
          {availableSubcategories.map((sub) => {
            const isSelected = activeSubcategory === sub.id || (!activeSubcategory && sub.id === 'all');
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => updateFilters({ genre: sub.id })}
                className={`flex-shrink-0 px-3 py-1.5 min-h-[36px] flex items-center justify-center rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 border ${
                  isSelected
                    ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/40'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Controls: Type (Movies / Series) & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-neutral-900/60 p-3.5 sm:p-4 rounded-2xl border border-neutral-800/80">
        {/* Media Type Filter */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-xs text-neutral-400 ml-1 sm:ml-2 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            نوع العرض:
          </span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'movie', label: 'أفلام فقط' },
            { id: 'series', label: 'مسلسلات فقط' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => updateFilters({ type: t.id })}
              className={`px-3.5 py-2 min-h-[40px] flex items-center justify-center rounded-xl text-xs font-medium transition cursor-pointer active:scale-95 ${
                activeType === t.id
                  ? 'bg-neutral-800 text-white font-bold border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-neutral-900/40 hover:bg-neutral-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="text-xs text-neutral-400 shrink-0 font-medium">الترتيب:</span>
          <select
            value={activeSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-full sm:w-auto bg-neutral-950 text-xs text-neutral-200 border border-neutral-800 rounded-xl px-3 py-2 min-h-[40px] focus:outline-none focus:border-red-600 cursor-pointer font-medium"
          >
            <option value="latest">الأحدث إضافة</option>
            <option value="rating">الأعلى تقييماً (IMDb)</option>
            <option value="year">سنة الإنتاج</option>
          </select>
        </div>
      </div>
    </div>
  );
}
