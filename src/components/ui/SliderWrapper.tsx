"use client";

import { useRef, useState } from "react";

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const BTN =
  "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-200 hover:bg-accent hover:text-charcoal active:scale-90 text-gray-600";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface SliderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function SliderWrapper({ children, className = "" }: SliderWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const lastXRef    = useRef(0);
  const [dragging, setDragging] = useState(false);

  /* ── cancel any running RAF ───────────────────── */
  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /* ── custom eased scroll (arrow buttons) ─────── */
  const animateScroll = (totalDelta: number, duration = 360) => {
    const el = containerRef.current;
    if (!el) return;
    cancelRaf();

    const t0 = performance.now();
    let scrolled = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1);
      const target   = totalDelta * easeOutCubic(progress);
      // scrollBy keeps the call RTL-safe (positive left = scroll right, negative = left)
      el.scrollBy({ left: target - scrolled });
      scrolled = target;
      rafRef.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  /* ── measure one card slot ───────────────────── */
  const getStep = (): number => {
    const el = containerRef.current;
    if (!el) return 280;
    const first = el.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 16 : 280; // width + gap-4
  };

  const scroll = (dir: "next" | "prev") => {
    const step = getStep();
    // RTL: next items are to the LEFT → negative delta
    //      prev items are to the RIGHT → positive delta
    animateScroll(dir === "next" ? -step : step);
  };

  /* ── mouse drag ──────────────────────────────── */
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // prevent text-selection highlight during drag
    cancelRaf();

    lastXRef.current    = e.pageX;
    velocityRef.current = 0;
    setDragging(true);

    const el = containerRef.current;
    if (!el) return;

    let totalDrag = 0;
    let moved = false;

    const handleMove = (ev: MouseEvent) => {
      const dx = lastXRef.current - ev.pageX; // positive = mouse moved left
      totalDrag += Math.abs(dx);
      if (totalDrag > 6) moved = true;
      velocityRef.current = dx;
      // -dx: moving left (dx > 0) → scrollBy negative-left = scroll left = reveal next items ✓
      el.scrollBy({ left: dx });
      lastXRef.current = ev.pageX;
    };

    const handleUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup",   handleUp);

      // Block the click event that fires immediately after mouseup if the user actually dragged,
      // so that links/buttons inside cards don't activate accidentally.
      if (moved) {
        window.addEventListener(
          "click",
          (ev) => {
            ev.preventDefault();   // stops link navigation
            ev.stopPropagation();  // stops other click handlers
          },
          { once: true, capture: true }
        );
      }

      // Momentum coast — amplify last recorded velocity and decelerate with friction
      let vel = velocityRef.current * 6;
      if (Math.abs(vel) < 1) return;

      const coast = () => {
        vel *= 0.88; // friction: ~0.5s to stop
        if (Math.abs(vel) < 0.5) { rafRef.current = null; return; }
        el.scrollBy({ left: vel });
        rafRef.current = requestAnimationFrame(coast);
      };
      rafRef.current = requestAnimationFrame(coast);
    };

    // Attach to window so drag continues even when cursor leaves the container
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup",   handleUp);
  };

  return (
    <div className="relative group/slider">
      {/* Prev — RIGHT side (inset-s-0 = right in RTL) */}
      <button
        onClick={() => scroll("prev")}
        aria-label="قبلی"
        className={`${BTN} inset-s-0 -ms-5 max-md:hidden`}
      >
        <ChevronRightIcon />
      </button>

      <div
        ref={containerRef}
        className={`flex overflow-x-auto scrollbar-hide gap-4 pb-2 ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        } ${className}`}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>

      {/* Next — LEFT side (inset-e-0 = left in RTL) */}
      <button
        onClick={() => scroll("next")}
        aria-label="بعدی"
        className={`${BTN} inset-e-0 -me-5 max-md:hidden`}
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}
