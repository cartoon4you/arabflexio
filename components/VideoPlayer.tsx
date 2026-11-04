'use client';

import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { ServerOption } from '@/lib/types';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Server } from 'lucide-react';

interface VideoPlayerProps {
  servers: ServerOption[];
  title: string;
}

export function VideoPlayer({ servers, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const activeServer = servers[currentServerIndex] || servers[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeServer?.url) return;

    setIsLoading(true);
    let hls: Hls | null = null;

    if (activeServer.url.endsWith('.m3u8') && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(activeServer.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });
      hls.on(Hls.Events.ERROR, () => {
        setIsLoading(false);
      });
    } else {
      video.src = activeServer.url;
      const handleCanPlay = () => setIsLoading(false);
      video.addEventListener('canplay', handleCanPlay);
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [activeServer?.url]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = Number(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        onMouseMove={() => setShowControls(true)}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 group select-none"
      >
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          </div>
        )}

        {!isPlaying && !isLoading && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/40 hover:scale-110 transition-transform"
            aria-label="تشغيل"
          >
            <Play className="w-8 h-8 fill-current mr-0.5" />
          </button>
        )}

        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700 accent-amber-500 rounded-lg cursor-pointer mb-3"
          />

          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-1 hover:text-amber-400">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button onClick={() => {
                if (videoRef.current) videoRef.current.currentTime -= 10;
              }} className="p-1 hover:text-amber-400" title="إرجاع 10 ثواني">
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <button onClick={toggleMute} className="p-1 hover:text-amber-400">
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-zinc-700 accent-amber-500 rounded-lg cursor-pointer hidden sm:block"
                />
              </div>

              <span className="text-zinc-400 font-mono text-[11px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-zinc-400 hidden md:inline text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-800">
                {activeServer?.quality || 1080}p
              </span>
              <button onClick={toggleFullscreen} className="p-1 hover:text-amber-400" title="شاشة كاملة">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/80 border border-white/10">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-white">سيرفرات المشاهدة المتاحة:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {servers.map((server, index) => (
            <button
              key={index}
              onClick={() => setCurrentServerIndex(index)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                index === currentServerIndex
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/5'
              }`}
            >
              {server.name} ({server.quality}p)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
