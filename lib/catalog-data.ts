import { MediaItem } from './types';

// ============================================================================
// SAMPLE_CATALOG — بيانات وصفية فقط (Metadata-only seed data)
// ============================================================================
// هذه العناصر تُستخدم كبيانات احتياطية عندما يتعذّر الوصول إلى Akwam.
// حقول `servers` و `episodes[].servers` فارغة عمداً:
//   - الروابط الحقيقية تُجلب عند الطلب عبر getMediaDetails(id) / grabLinks(url)
//     من lib/scraper.ts.
//   - لا تُضِف روابط وهمية (oceans.mp4 / sintel/trailer.mp4) هنا. هذا كان
//     يُشغّل فيديو تجريبياً للمستخدم بدلاً من الفيلم المطلوب.
// ============================================================================

export const SAMPLE_CATALOG: MediaItem[] = [
  {
    id: 'movie_1',
    title: 'ولاد رزق 3: القاضية',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    story: 'بعد سنوات من التفرق والانفصال، يجد الأخوة أنفسهم مجبرين على العودة لعملية سطو خطيرة ومصيرية في الرياض.',
    rating: '8.8',
    year: '2024',
    category: 'arabic-movies',
    categoryLabel: 'أفلام عربية',
    type: 'movie',
    genres: ['أكشن', 'جريمة', 'تشويق'],
    duration: '124 دقيقة',
    country: 'مصر',
    director: 'طارق العريان',
    cast: ['أحمد عز', 'عمرو يوسف', 'كريم قاسم', 'آسر ياسين'],
    isFeatured: true,
    servers: [],
  },
  {
    id: 'movie_2',
    title: 'Dune: Part Two',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    story: 'يواصل بول أتريدس رحلته الأسطورية ومعه تشاني وفرقة الفريمن للانتقام من المتآمرين الذين دمروا عائلته وإنقاذ مجرى الكون.',
    rating: '8.9',
    year: '2024',
    category: 'foreign-movies',
    categoryLabel: 'أفلام أجنبية',
    type: 'movie',
    genres: ['خيال علمي', 'مغامرة', 'أكشن'],
    duration: '166 دقيقة',
    country: 'الولايات المتحدة',
    director: 'دينيس فيلنوف',
    cast: ['تيموثي شالاماي', 'زيندايا', 'ريبيكا فيرجسون'],
    isFeatured: true,
    servers: [],
  },
  {
    id: 'series_1',
    title: 'المؤسس عثمان - الموسم السادس',
    poster: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
    story: 'تستمر الملحمة التاريخية في تصوير تأسيس الدولة العثمانية ونقلها من الفقر والضياع إلى القوة والصلابة بقيادة الغازي عثمان.',
    rating: '8.4',
    year: '2024',
    category: 'turkish-series',
    categoryLabel: 'مسلسلات تركية',
    type: 'series',
    genres: ['تاريخي', 'حروب', 'دراما'],
    country: 'تركيا',
    isFeatured: true,
    servers: [],
    episodes: [
      {
        id: 'osman_ep_1',
        number: 1,
        title: 'الحلقة 1 - بداية العاصفة',
        url: '/watch?id=series_1&ep=1',
        servers: [],
      },
      {
        id: 'osman_ep_2',
        number: 2,
        title: 'الحلقة 2 - كمين القلعة',
        url: '/watch?id=series_1&ep=2',
        servers: [],
      },
    ],
  },
  {
    id: 'series_2',
    title: 'الحشاشين',
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
    story: 'في إطار تاريخي خلال القرن الحادي عشر، تدور أحداث المسلسل حول حسن الصباح زعيم جماعة الحشاشين الإرهابية في قلعة ألموت.',
    rating: '8.7',
    year: '2024',
    category: 'arabic-series',
    categoryLabel: 'مسلسلات عربية',
    type: 'series',
    genres: ['تاريخي', 'إثارة', 'دراما'],
    country: 'مصر',
    director: 'بيتر ميمي',
    cast: ['كريم عبد العزيز', 'فتحي عبد الوهاب', 'أحمد عيد'],
    isFeatured: true,
    servers: [],
    episodes: [
      {
        id: 'hashashin_ep_1',
        number: 1,
        title: 'الحلقة 1 - عهد الأصدقاء الثلاثة',
        url: '/watch?id=series_2&ep=1',
        servers: [],
      },
    ],
  },
  {
    id: 'anime_1',
    title: 'Solo Leveling: Arise',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
    story: 'في عالم تظهر فيه بوابات غامضة تربط عالم البشر بالوحوش، ينهض الصياد سونغ جين وو من أضعف صياد إلى أقوى مقاتل في العالم.',
    rating: '8.6',
    year: '2024',
    category: 'anime',
    categoryLabel: 'أنمي مترجم',
    type: 'series',
    genres: ['أنمي', 'أكشن', 'فانتازيا'],
    country: 'اليابان',
    servers: [],
  },
  {
    id: 'movie_3',
    title: 'The Batman: Part II',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
    story: 'يواصل بروس واين استكشاف أعماق الفساد في مدينة غوثام ومواجهة أعداء جدد يهددون استقرار المدينة.',
    rating: '8.5',
    year: '2025',
    category: 'foreign-movies',
    categoryLabel: 'أفلام أجنبية',
    type: 'movie',
    genres: ['أكشن', 'جريمة', 'غموض'],
    servers: [],
  },
  {
    id: 'movie_4',
    title: 'طاش ما طاش - الموفي',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    story: 'مغامرة كوميدية استثنائية تجتمع فيها الشخصيات المحبوبة في مواقف اجتماعية ساخرة وممتعة.',
    rating: '7.9',
    year: '2024',
    category: 'arabic-movies',
    categoryLabel: 'أفلام عربية',
    type: 'movie',
    genres: ['كوميديا', 'عائلي'],
    servers: [],
  },
];

export const CATEGORIES_LIST = [
  { id: 'all', label: 'الكل', href: '/catalog?category=all' },
  { id: 'arabic-movies', label: 'أفلام عربية', href: '/catalog?category=arabic-movies' },
  { id: 'foreign-movies', label: 'أفلام أجنبية', href: '/catalog?category=foreign-movies' },
  { id: 'arabic-series', label: 'مسلسلات عربية', href: '/catalog?category=arabic-series' },
  { id: 'foreign-series', label: 'مسلسلات أجنبية', href: '/catalog?category=foreign-series' },
  { id: 'turkish-series', label: 'مسلسلات تركية', href: '/catalog?category=turkish-series' },
  { id: 'anime', label: 'أنمي مترجم', href: '/catalog?category=anime' },
  { id: 'world-cinema', label: 'سينما عالمية', href: '/worldcinema' },
];

export const CATEGORIES = [
  {
    id: 'arabic-movies',
    label: 'أفلام عربية',
    subcategories: [
      { id: 'action', label: 'أكشن' },
      { id: 'comedy', label: 'كوميديا' },
      { id: 'drama', label: 'دراما' },
      { id: 'thriller', label: 'تشويق' },
    ],
  },
  {
    id: 'foreign-movies',
    label: 'أفلام أجنبية',
    subcategories: [
      { id: 'action', label: 'أكشن' },
      { id: 'sci-fi', label: 'خيال علمي' },
      { id: 'adventure', label: 'مغامرة' },
      { id: 'horror', label: 'رعب' },
    ],
  },
  {
    id: 'arabic-series',
    label: 'مسلسلات عربية',
    subcategories: [
      { id: 'drama', label: 'دراما' },
      { id: 'historical', label: 'تاريخي' },
      { id: 'comedy', label: 'كوميديا' },
    ],
  },
  {
    id: 'foreign-series',
    label: 'مسلسلات أجنبية',
    subcategories: [
      { id: 'drama', label: 'دراما' },
      { id: 'mystery', label: 'غموض' },
      { id: 'sci-fi', label: 'خيال علمي' },
    ],
  },
  {
    id: 'turkish-series',
    label: 'مسلسلات تركية',
    subcategories: [
      { id: 'historical', label: 'تاريخي' },
      { id: 'drama', label: 'دراما' },
      { id: 'romance', label: 'رومانسي' },
    ],
  },
  {
    id: 'anime',
    label: 'أنمي مترجم',
    subcategories: [
      { id: 'action', label: 'أكشن' },
      { id: 'fantasy', label: 'فانتازيا' },
      { id: 'adventure', label: 'مغامرة' },
    ],
  },
];

export const ALL_GENRES = [
  { id: 'all', label: 'الكل' },
  { id: 'action', label: 'أكشن' },
  { id: 'drama', label: 'دراما' },
  { id: 'comedy', label: 'كوميديا' },
  { id: 'historical', label: 'تاريخي' },
  { id: 'sci-fi', label: 'خيال علمي' },
  { id: 'thriller', label: 'تشويق' },
  { id: 'horror', label: 'رعب' },
  { id: 'fantasy', label: 'فانتازيا' },
];