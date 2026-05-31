'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  name: string;
}

export default function ImageGallery({ images, name }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const hasMultiple = images.length > 1;

  // Pad to at least 4 thumbnails using the first image as fallback
  const thumbs = images.length >= 4
    ? images
    : [...images, ...Array<string>(4 - images.length).fill(images[0] ?? '')];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* ── Main image with hover zoom ────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden cursor-zoom-in select-none"
        style={{ height: 380 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => { setIsZoomed(false); setOrigin('50% 50%'); }}
      >
        <Image
          src={thumbs[activeIdx] ?? ''}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-6"
          style={{
            transformOrigin: origin,
            transform: isZoomed ? 'scale(2.3)' : 'scale(1)',
            // Instant tracking while zoomed; smooth scale-out on leave
            transition: isZoomed ? 'none' : 'transform 0.35s ease',
          }}
        />

        {/* Zoom hint — fades out when zoomed */}
        <div
          className="absolute bottom-3 inset-s-3 flex items-center gap-1.5 bg-black/40 text-white text-xs px-2.5 py-1.5 rounded-lg backdrop-blur-sm pointer-events-none transition-opacity duration-200"
          style={{ opacity: isZoomed ? 0 : 1 }}
        >
          {/* magnify icon */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          برای بزرگ‌نمایی هاور کنید
        </div>
      </div>

      {/* ── Thumbnail strip (only when more than one image) ─────── */}
      {hasMultiple && <div className="flex gap-2 overflow-x-auto pb-0.5" dir="ltr">
        {thumbs.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={[
              'shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all duration-150',
              activeIdx === idx
                ? 'border-accent shadow-md scale-105'
                : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100',
            ].join(' ')}
            aria-label={`تصویر ${idx + 1}`}
          >
            <div className="relative w-full h-full">
              <Image src={img} alt={`${name} - تصویر ${idx + 1}`} fill className="object-contain p-1" />
            </div>
          </button>
        ))}
      </div>
      }
        </div>
  );
}
