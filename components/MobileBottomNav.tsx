'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Bookmark, LogIn, User } from 'lucide-react';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMounted } from '@/hooks/use-mounted';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { watchlist } = useWatchlist();
  const { currentUser, signInWithGoogle } = useAuth();
  const mounted = useIsMounted();

  const handleBottomLoginClick = (e: React.MouseEvent) => {
    if (!currentUser) {
      e.preventDefault();
      const loginSection = document.getElementById('bottom-login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        signInWithGoogle().catch((err) => console.error(err));
      }
    }
  };

  const navItems = [
    {
      id: 'bottom-nav-home',
      label: 'الرئيسية',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      id: 'bottom-nav-movies',
      label: 'الأفلام',
      href: '/catalog?type=movie',
      icon: Film,
      isActive: pathname === '/catalog' && typeof window !== 'undefined' && window.location.search.includes('type=movie'),
    },
    {
      id: 'bottom-nav-series',
      label: 'المسلسلات',
      href: '/catalog?type=series',
      icon: Tv,
      isActive: pathname === '/catalog' && typeof window !== 'undefined' && window.location.search.includes('type=series'),
    },
    {
      id: 'bottom-nav-watchlist',
      label: 'قائمتي',
      href: '/watchlist',
      icon: Bookmark,
      isActive: pathname === '/watchlist',
      badge: mounted && watchlist.length > 0 ? watchlist.length : undefined,
    },
    {
      id: 'bottom-nav-account',
      label: currentUser ? 'حسابي' : 'تسجيل الدخول',
      href: '#bottom-login-section',
      icon: currentUser ? User : LogIn,
      isActive: false,
      onClick: handleBottomLoginClick,
    },
  ];

  return (
    <nav
      id="mobile-bottom-navbar"
      aria-label="التنقل السريع للجوال"
      className="fixed top-14 inset-x-0 z-40 md:hidden bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800/90 shadow-md shadow-black/40"
      dir="rtl"
    >
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              id={item.id}
              href={item.href}
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] py-1 transition-all select-none active:scale-90 ${
                active ? 'text-red-500 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold font-mono flex items-center justify-center border border-neutral-950">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 leading-none tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
