import React from 'react';
import Link from 'next/link';
import { Compass, Film, Globe } from 'lucide-react';
import { SAMPLE_CATALOG } from '@/lib/catalog-data';
import { MovieCard } from '@/components/MovieCard';

export default function WorldCinemaPage() {
  const worldMovies = SAMPLE_CATALOG.filter((i) => i.category === 'foreign-movies' || i.category === 'anime');

  const regions = [
    { name: 'السينما الكورية والآسيوية', count: '140+ فيلم' },
    { name: 'السينما الأوروبية المستقلة', count: '95+ فيلم' },
    { name: 'السينما الهندية (بوليوود)', count: '120+ فيلم' },
    { name: 'السينما التركية واللاتينية', count: '80+ فيلم' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-3 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-amber-400">الرئيسية</Link>
          <span>/</span>
          <span className="text-amber-400">سينما عالمية</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
          <Compass className="w-7 h-7 text-amber-500" />
          السينما العالمية والمهرجانات
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
          روائع السينما الدولية المستقلة، الأفلام الفائزة بالأوسكار، ومهرجانات كان وفينيسيا وبرلين السينمائية.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {regions.map((region) => (
          <div
            key={region.name}
            className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-1 hover:border-amber-500/30 transition-colors"
          >
            <Globe className="w-5 h-5 text-amber-500 mb-2" />
            <h4 className="text-xs font-bold text-white">{region.name}</h4>
            <p className="text-[11px] text-zinc-500">{region.count}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-amber-500" />
          مختارات عالمية استثنائية
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {worldMovies.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
