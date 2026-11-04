import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ArabFlex - سينما وأفلام ومسلسلات',
    short_name: 'ArabFlex',
    description: 'منصة ArabFlex لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والتركية والأجنبية والأنمي بجودة عالية وسيرفرات مباشرة.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0f19',
    theme_color: '#0b0f19',
    categories: ['entertainment', 'movies', 'tv'],
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/yemenflex-logo-sq.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/yemenflex-logo-sq.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
