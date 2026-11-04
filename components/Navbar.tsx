'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Film, Tv, Bookmark, Compass, LogIn, LogOut, Download, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { useIsMounted } from '@/hooks/use-mounted';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const { watchlist } = useWatchlist();
  const mounted = useIsMounted();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: 'الرئيسية', href: '/', icon: Sparkles },
    { label: 'أفلام', href: '/catalog?category=arabic-movies', icon: Film },
    { label: 'مسلسلات', href: '/catalog?category=arabic-series', icon: Tv },
    { label: 'سينما عالمية', href: '/worldcinema', icon: Compass },
    { label: 'مستخرج الروابط', href: '/linkgrabber', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors" dir="ltr">
              Arab<span className="text-amber-500">Flex</span>
            </span>
            <span className="text-[10px] text-zinc-400 -mt-1 font-medium">سينما وترفيه العرب</span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search bar & Actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative hidden sm:block w-48 lg:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن فيلم أو مسلسل..."
              className="w-full bg-zinc-900/90 text-sm text-white placeholder-zinc-500 rounded-lg pl-3 pr-9 py-1.5 border border-white/10 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Watchlist */}
          <Link
            href="/watchlist"
            className="relative p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            title="قائمتي"
          >
            <Bookmark className="w-5 h-5" />
            {mounted && watchlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {watchlist.length}
              </span>
            )}
          </Link>

          {/* User Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 hidden lg:inline max-w-[100px] truncate">
                {currentUser.displayName || 'مستخدم'}
              </span>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}