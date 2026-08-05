"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { HeroBannerVM, HeroContentVM } from "@/src/lib/serializers";

const AUTOPLAY_MS = 5500;
/** Minimum horizontal drag (px) before a slide change commits. */
const DRAG_THRESHOLD = 48;

const anim = (name: string, dur: string, delay: string) =>
  ({ animation: `${name} ${dur} ease-out ${delay} both` }) as React.CSSProperties;

function CtaLink({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-charcoal font-bold text-[15px] sm:text-base px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl shadow-[0_10px_30px_-12px_rgba(244,194,50,0.7)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      : "inline-flex items-center justify-center gap-2 border border-white/25 hover:border-accent/80 bg-white/5 hover:bg-white/10 text-white hover:text-accent font-semibold text-[15px] sm:text-base px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]";

  const isExternal = /^https?:\/\//i.test(href);

  if (isExternal) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function HeroBanner({
  content,
  images,
}: {
  content: HeroContentVM;
  images: HeroBannerVM[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragActive = useRef(false);
  const count = images.length;

  function goTo(next: number) {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  }

  useEffect(() => {
    if (count <= 1 || paused || dragging) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, dragging]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (count <= 1 || e.button !== 0) return;
    dragActive.current = true;
    dragStartX.current = e.clientX;
    setDragging(true);
    setDragX(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragActive.current) return;
    setDragX(e.clientX - dragStartX.current);
  }

  function endDrag(clientX: number) {
    if (!dragActive.current) return;
    dragActive.current = false;
    const delta = clientX - dragStartX.current;
    setDragging(false);
    setDragX(0);

    if (count <= 1 || Math.abs(delta) < DRAG_THRESHOLD) return;
    // Drag image left → next; drag right → previous (works for mouse + touch).
    setIndex((prev) => {
      if (delta < 0) return (prev + 1) % count;
      return (prev - 1 + count) % count;
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    endDrag(e.clientX);
  }

  function onPointerCancel() {
    dragActive.current = false;
    setDragging(false);
    setDragX(0);
  }

  const hasCopy = Boolean(content.title.trim() || content.description.trim());
  if (!hasCopy && count === 0) return null;

  const showDots = count > 1;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const dragOpacity = dragging
    ? Math.max(0.35, 1 - Math.abs(dragX) / 280)
    : 1;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-bl from-[#2b2b2b] via-[#3f3f3f] to-[#1f1f1f] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>
      <div className="absolute -top-24 -start-16 w-72 h-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -end-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center min-h-[320px] sm:min-h-[380px]">
          {/* Static text — right in RTL */}
          <div className="order-2 lg:order-1">
            <div
              style={anim("fade-in-up", "0.55s", "0.04s")}
              className="inline-flex items-center gap-2 mb-5"
            >
              <span className="w-10 h-[3px] rounded-full bg-accent" />
              <span className="text-accent text-xs sm:text-sm font-semibold tracking-wide">
                فروشگاه قطعات یدکی کارخودرو
              </span>
            </div>

            {content.title.trim() && (
              <h1
                style={anim("fade-in-up", "0.6s", "0.1s")}
                className="text-[1.85rem] sm:text-4xl lg:text-[2.75rem] font-black leading-[1.35] sm:leading-[1.3] tracking-tight mb-5 max-w-xl"
              >
                {content.title}
              </h1>
            )}

            {content.description.trim() && (
              <p
                style={anim("fade-in-up", "0.6s", "0.2s")}
                className="text-gray-300/95 text-[0.95rem] sm:text-lg leading-8 sm:leading-9 mb-8 max-w-md font-medium"
              >
                {content.description}
              </p>
            )}

            {(content.button1Text.trim() || content.button2Text.trim()) && (
              <div
                style={anim("fade-in-up", "0.55s", "0.3s")}
                className="flex flex-wrap gap-3 sm:gap-3.5"
              >
                {content.button1Text.trim() && content.button1Href.trim() && (
                  <CtaLink href={content.button1Href} variant="primary">
                    {content.button1Text}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      className="w-4 h-4 rotate-180"
                      aria-hidden
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </CtaLink>
                )}
                {content.button2Text.trim() && content.button2Href.trim() && (
                  <CtaLink href={content.button2Href} variant="secondary">
                    {content.button2Text}
                  </CtaLink>
                )}
              </div>
            )}
          </div>

          {/* Image slider — left in RTL; drag/swipe to change slides */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-xl">
              <div className="absolute inset-6 sm:inset-10 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
              <div
                className={[
                  "relative aspect-[5/4] overflow-hidden select-none touch-pan-y",
                  showDots ? (dragging ? "cursor-grabbing" : "cursor-grab") : "",
                ].join(" ")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                role={showDots ? "region" : undefined}
                aria-roledescription={showDots ? "carousel" : undefined}
                aria-label={showDots ? "اسلایدر تصاویر هیرو — برای تعویض بکشید" : undefined}
              >
                {count === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
                    تصویری ثبت نشده
                  </div>
                ) : (
                  images.map((image, i) => {
                    const isActive = i === safeIndex;
                    return (
                      <div
                        key={image.id}
                        className={[
                          "absolute inset-0",
                          dragging && isActive
                            ? "transition-none z-[1]"
                            : "transition-all duration-700 ease-out",
                          isActive
                            ? "opacity-100 scale-100 z-[1]"
                            : "opacity-0 scale-[0.96] z-0 pointer-events-none",
                        ].join(" ")}
                        style={
                          isActive
                            ? {
                                opacity: dragOpacity,
                                transform: `translateX(${dragging ? dragX * 0.35 : 0}px) scale(1)`,
                              }
                            : undefined
                        }
                        aria-hidden={!isActive}
                      >
                        <Image
                          src={image.imageUrl}
                          alt={content.title || "بنر صفحه اصلی"}
                          fill
                          priority={i === 0}
                          draggable={false}
                          sizes="(max-width: 1024px) 90vw, 42vw"
                          className="object-contain object-center drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)] p-1 sm:p-3 pointer-events-none"
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {showDots && (
                <div className="mt-5 flex justify-center gap-2">
                  {images.map((image, i) => (
                    <button
                      key={image.id}
                      type="button"
                      aria-label={`اسلاید ${i + 1}`}
                      aria-current={i === safeIndex}
                      onClick={() => goTo(i)}
                      className={[
                        "h-2 rounded-full transition-all duration-300",
                        i === safeIndex ? "w-7 bg-accent" : "w-2 bg-white/40 hover:bg-white/70",
                      ].join(" ")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 leading-[0]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-8 sm:h-10"
        >
          <path
            d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
