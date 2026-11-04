'use client';

import React, { useState } from 'react';
import { Tv, Play, Search } from 'lucide-react';
import { EpisodeItem } from '@/lib/types';

interface EpisodesGridProps {
  episodes: EpisodeItem[];
  selectedEpisode: EpisodeItem | null;
  onSelectEpisode: (episode: EpisodeItem) => void;
}

export default function EpisodesGrid({
  episodes,
  selectedEpisode,
  onSelectEpisode,
}: EpisodesGridProps) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!episodes || episodes.length === 0) return null;

  const filteredEpisodes = episodes.filter(
    (ep) =>
      ep.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (ep.number ?? ep.episodeNumber ?? '').toString().includes(filterQuery)
  );

  return (
    <div
      id="episodes-selection-section"
      className="bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-5 space-y-4 shadow-xl"
      dir="rtl"
    >
      {/* Header with Counter and Quick Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">قائمة الحلقات</h3>
            <p className="text-xs text-neutral-400 font-mono">
              إجمالي الحلقات: {episodes.length} حلقة
            </p>
          </div>
        </div>

        {/* Filter input */}
        {episodes.length > 8 && (
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="ابحث برقم أو اسم الحلقة..."
              className="w-full bg-neutral-950 text-xs text-white placeholder-neutral-500 pl-3 pr-8 py-1.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-red-600"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-neutral-500" />
          </div>
        )}
      </div>

      {/* Episodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredEpisodes.map((ep) => {
          const isCurrent = selectedEpisode?.id === ep.id;
          return (
            <button
              key={ep.id}
              type="button"
              id={`episode-btn-${ep.id}`}
              onClick={() => onSelectEpisode(ep)}
              className={`flex flex-col text-right p-3 rounded-xl border transition-all duration-200 group active:scale-95 ${
                isCurrent
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/50 scale-[1.02]'
                  : 'bg-neutral-800/70 border-neutral-700/50 text-neutral-300 hover:bg-neutral-800 hover:text-white hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40">
                  حلقة {ep.number ?? ep.episodeNumber ?? 1}
                </span>
                <Play
                  className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
                    isCurrent ? 'fill-white' : 'opacity-40 group-hover:opacity-100'
                  }`}
                />
              </div>

              <span className="text-xs font-semibold line-clamp-1 mt-0.5">
                {ep.title}
              </span>

              {ep.duration && (
                <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                  {ep.duration}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
