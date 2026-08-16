"use client";

import { useState } from "react";
import Image from "next/image";

const STATIC_FALLBACK = "/logo.png";

interface BrandLogoProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

export default function BrandLogo({ src, alt, sizes, className }: BrandLogoProps) {
  const normalizedSrc = src || STATIC_FALLBACK;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = failedSrc === normalizedSrc ? STATIC_FALLBACK : normalizedSrc;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (resolvedSrc !== STATIC_FALLBACK) setFailedSrc(normalizedSrc);
      }}
    />
  );
}
