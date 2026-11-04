import React from 'react';
import Link from 'next/link';
import { getCatalogItems } from '@/lib/scraper-service';
import { CATEGORIES_LIST } from '@/lib/catalog-data';
import { MovieCard } from '@/components/MovieCard';
import { Film, ChevronRight, ChevronLeft } from 'lucide-react';

interface CatalogPageProps {
  searchParams: Promise<{
    category?: string;
    page?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const currentCategory = params.category || 'all';
  const currentPage = parseInt(params.page || '1', 10);

  const activeCategoryMeta = CATEGORIES_LIST.find((c) => c.id === currentCategory) || {
    id: 'all',
    label: 'جميع الأعمال',
  };

  const { items, hasMore } = await getCatalogItems(currentCategory, currentPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-amber-400">الرئيسية</Link>
            <span>/</span>
            <span className="text-amber-400">{activeCategoryMeta.label}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Film className="w-7 h-7 text-amber-500" />
            {activeCategoryMeta.label}
          </h1>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES_LIST.map((cat) => {
            const isSelected = cat.id === currentCategory;
            return (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-white/5'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
          <p className="text-lg font-bold text-white">لم يتم العثور على أعمال في هذا القسم حالياً</p>
          <p className="text-xs text-zinc-400">يرجى اختيار قسم آخر أو العودة للصفحة الرئيسية.</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 pt-8">
        {currentPage > 1 && (
          <Link
            href={`/catalog?category=${currentCategory}&page=${currentPage - 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الصفحة السابقة</span>
          </Link>
        )}

        <span className="text-xs font-bold text-zinc-400 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-white/5">
          صفحة {currentPage}
        </span>

        {hasMore && (
          <Link
            href={`/catalog?category=${currentCategory}&page=${currentPage + 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black shadow-md shadow-amber-500/20"
          >
            <span>الصفحة التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
