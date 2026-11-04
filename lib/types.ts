export interface ServerOption {
  name: string;
  quality: number;
  url: string;
  referer?: string;
  type?: 'mp4' | 'hls' | 'embed';
}

export interface EpisodeItem {
  id: string;
  number: number;
  episodeNumber?: number;
  title: string;
  url: string;
  poster?: string;
  duration?: string;
  servers?: ServerOption[];
}

export interface MediaItem {
  id: string;
  title: string;
  poster: string;
  story: string;
  rating: string;
  year: string;
  category: string;
  categoryLabel?: string;
  type: 'movie' | 'series';
  genres: string[];
  duration?: string;
  director?: string;
  cast?: string[];
  country?: string;
  trailerUrl?: string;
  isFeatured?: boolean;
  banner?: string;
  backdrop?: string;
  originalTitle?: string;
  badge?: string;
  quality?: string;
  servers: ServerOption[];
  episodes?: EpisodeItem[];
}

export interface WatchlistItem {
  id: string;
  title: string;
  poster: string;
  rating: string;
  year: string;
  type: 'movie' | 'series';
  userId: string;
  addedAt: string;
}

export interface LinkGrabberFile {
  quality: string;
  size: string;
  downloadUrl: string;
  watchUrl?: string;
}

export interface LinkGrabberResult {
  title: string;
  poster?: string;
  originalUrl: string;
  files: LinkGrabberFile[];
  streamServers: ServerOption[];
}

export interface SubCategoryOption {
  id: string;
  label: string;
}
