import React, { useEffect, useRef, useState } from 'react';

/**
 * AkwamPlayer Component for React + Node.js/Express
 *
 * Solves:
 * 1. Autoplay NotAllowedError via Muted Autoplay + Promise handling (.catch).
 * 2. Prominent Unmute banner complying with modern Chrome policies.
 * 3. MKV detection & fallback warning for HTML5 players.
 * 4. Connects seamlessly with Express / Next.js Range Video Proxy (Status 206).
 */
export default function AkwamPlayer({
  src,
  poster,
  title = 'Akwam Stream',
  proxyBaseUrl = '/api/proxy/video',
  referer = 'https://akwam.ss/',
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mutedAutoplayActive, setMutedAutoplayActive] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMkv, setIsMkv] = useState(false);

  // Compute stream URL through Express / Next.js proxy
  const finalStreamUrl = `${proxyBaseUrl}?url=${encodeURIComponent(src)}&referer=${encodeURIComponent(referer)}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Detect MKV container
    const isMkvFormat = src.toLowerCase().includes('.mkv');
    setIsMkv(isMkvFormat);

    // Enforce muted state initially to pass Chrome autoplay policy
    video.muted = true;
    setIsMuted(true);
    setMutedAutoplayActive(true);
    setAutoplayBlocked(false);

    video.src = finalStreamUrl;
    video.load();

    const handleCanPlay = () => {
      // Safe Play handling Promise rejection
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Autoplay prevented:', err.name, err.message);
            setIsPlaying(false);
            if (err.name === 'NotAllowedError') {
              setAutoplayBlocked(true);
            }
          });
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, finalStreamUrl]);

  // User click action to Unmute and enable sound
  const handleUnmuteClick = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    setIsMuted(false);
    setMutedAutoplayActive(false);
    setAutoplayBlocked(false);

    if (video.paused) {
      video.play().catch((e) => console.error('Play error on user gesture:', e));
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '960px', margin: '0 auto', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      {/* MKV Warning */}
      {isMkv && (
        <div style={{ background: '#78350f', color: '#fef3c7', padding: '10px 16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ صيغة MKV غير مدعومة في متصفح Chrome. يرجى اختيار سيرفر MP4 أو تحميل الفيديو لتشغيله عبر مشغل خارجي مثل VLC.</span>
          <a href={src} download target="_blank" rel="noreferrer" style={{ color: '#fff', background: '#92400e', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none' }}>تحميل</a>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Prominent Muted Autoplay CTA */}
      {mutedAutoplayActive && isPlaying && !autoplayBlocked && (
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
          <button
            onClick={handleUnmuteClick}
            style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            🔊 الصوت مكتوم تلقائياً — اضغط هنا لتفعيل الصوت (Unmute)
          </button>
        </div>
      )}

      {/* Fallback Click to Play Overlay (if browser blocks even muted autoplay) */}
      {autoplayBlocked && !isPlaying && (
        <div
          onClick={handleUnmuteClick}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dc2626', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#fff', fontSize: '24px', marginLeft: '4px' }}>▶</span>
          </div>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>انقر لبدء المشاهدة فوراً وتشغيل الصوت</p>
        </div>
      )}
    </div>
  );
}
