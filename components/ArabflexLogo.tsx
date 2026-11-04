'use client';

import React from 'react';

interface ArabflexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  priority?: boolean;
}

export default function ArabflexLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
}: ArabflexLogoProps) {
  // Dimensions mapping
  const dimensions = {
    sm: {
      titleClass: 'text-base font-extrabold',
      subClass: 'text-[9px]',
    },
    md: {
      titleClass: 'text-xl sm:text-2xl font-black',
      subClass: 'text-[10px]',
    },
    lg: {
      titleClass: 'text-2xl sm:text-3xl font-black',
      subClass: 'text-xs sm:text-sm',
    },
    xl: {
      titleClass: 'text-3xl sm:text-4xl font-black',
      subClass: 'text-sm sm:text-base',
    },
  }[size];

  return (
    <div
      id={`arabflex-logo-${size}`}
      className={`inline-flex flex-col text-left leading-tight select-none ${className}`}
      dir="ltr"
    >
      <div className="flex items-center tracking-tight">
        <span className={`${dimensions.titleClass} text-white font-black tracking-normal transition-colors group-hover:text-neutral-100`}>
          arab<span className="text-red-600 drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]">flex</span>
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`${dimensions.subClass} text-neutral-400 font-medium tracking-normal -mt-0.5`}
          dir="rtl"
        >
          لمشاهدة الأفلام والمسلسلات
        </span>
      )}
    </div>
  );
}
