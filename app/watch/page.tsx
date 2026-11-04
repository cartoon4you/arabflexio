import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getMediaDetails } from '@/lib/scraper-service';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Star, Calendar, Clock, ListFilter } from 'lucide-react';

interface WatchPageProps {
  searchParams: Promise<{
    id?: string;
    ep?: string;
  }>;
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const id = params.id;

  if (!id) {
    notFound();
  }

  const item = await getMediaDetails(id);

  if (!item) {
    notFound();
  }

  const selectedEpisodeNum = params.ep ? parseInt(params.ep, 10) : 1;
  const activeEpisode = item.episodes?.find((e) => e.number === selectedEpisodeNum) || item.episodes?.[0];

  let currentServers = item.servers || [];

  if (activeEpisode) {
    if (activeEpisode.servers && activeEpisode.servers.length > 0) {
      currentServers = activeEpisode.servers;
    } else if (activeEpisode.id && activeEpisode.id !== item.id) {
      const epDetails = await getMediaDetails(activeEpisode.id);
      if (epDetails && epDetails.servers && epDetails.servers.length > 0) {
        currentServers = epDetails.servers;
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/" className="hover:text-amber-400">الرئيسية</Link>
        <span>/</span>
        <Link href={`/catalog?category=${item.category}`} className="hover:text-amber-400">
          {item.categoryLabel || 'الأعمال'}
        </Link>
        <span>/</span>
        <span className="text-amber-400 truncate max-w-xs">{item.title}</span>
      </div>

      <div className="space-y-4">
        <VideoPlayer servers={currentServers} title={item.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-500 text-black text-xs font-bold px-2.5 py-1 rounded-md">
                {item.type === 'series' ? 'مسلسل' : 'فيلم'}
              </span>
              {item.rating && (
                <span className="flex items-center gap-1 bg-black/60 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {item.rating}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                {item.year}
              </span>
              {item.duration && (
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {item.title}
              {activeEpisode ? ` - ${activeEpisode.title}` : ''}
            </h1>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.genres?.map((genre) => (
                <span
                  key={genre}
                  className="text-xs text-zinc-300 bg-zinc-800/80 border border-white/5 px-2.5 py-1 rounded-md"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
            <h3 className="text-sm font-bold text-amber-400">قصة العمل</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {item.story}
            </p>
          </div>

          {item.episodes && item.episodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-white">حلقات المسلسل</h3>
                </div>
                <span className="text-xs text-zinc-400 font-medium">
                  {item.episodes.length} حلقة متوفرة
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                {item.episodes.map((ep) => {
                  const isCurrent = activeEpisode ? activeEpisode.id === ep.id || ep.number === selectedEpisodeNum : false;
                  const epTargetUrl = ep.id && ep.id !== item.id
                    ? `/watch?id=${encodeURIComponent(ep.id)}`
                    : `/watch?id=${item.id}&ep=${ep.number}`;
                  return (
                    <Link
                      key={ep.id}
                      href={epTargetUrl}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-black font-black border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border-white/5'
                      }`}
                    >
                      <div className="text-xs">{ep.title}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">الحلقة {ep.number}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 shadow-xl">
            <Image
              src={item.poster}
              alt={item.title}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3 text-xs">
            {item.director && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">المخرج:</span>
                <span className="text-zinc-200 font-medium">{item.director}</span>
              </div>
            )}
            {item.country && (
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">بلد الإنتاج:</span>
                <span className="text-zinc-200 font-medium">{item.country}</span>
              </div>
            )}
            {item.cast && item.cast.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-zinc-500 block">طاقم التمثيل:</span>
                <div className="flex flex-wrap gap-1">
                  {item.cast.map((actor) => (
                    <span key={actor} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
