"use client";

import { useRef, useState } from "react";

interface SliderWrapperProps {
  children: React.ReactNode;
  className?: string;
}

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
  "absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-accent hover:text-charcoal text-gray-600";

export default function SliderWrapper({ children, className = "" }: SliderWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const [dragging, setDragging] = useState(false);

  // Measure one card width + gap so each arrow click moves exactly one slide
  const getStep = (): number => {
    const el = containerRef.current;
    if (!el) return 280;
    const first = el.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + 16 : 280; // offsetWidth + gap-4
  };

  const scroll = (dir: "next" | "prev") => {
    const el = containerRef.current;
    if (!el) return;
    const step = getStep();
    // RTL: next items are to the LEFT  → scrollBy negative-left scrolls the viewport left
    //      prev items are to the RIGHT → scrollBy positive-left scrolls the viewport right
    el.scrollBy({ left: dir === "next" ? -step : step, behavior: "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    lastX.current = e.pageX;
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const el = containerRef.current;
    if (!el) return;
    const dx = lastX.current - e.pageX; // positive = mouse moved left
    // Use scrollBy so RTL direction is handled consistently by the browser
    // mouse moved left (dx > 0) → scroll viewport left (reveal next items) → left: -dx
    el.scrollBy({ left: -dx });
    lastX.current = e.pageX;
  };

  const stopDrag = () => {
    isDragging.current = false;
    setDragging(false);
  };

  return (
    <div className="relative group/slider">
      {/*
        RTL layout: start = RIGHT edge, end = LEFT edge.
        Prev button belongs on the RIGHT (start) — shows a → (go back right).
        Next button belongs on the LEFT (end) — shows a ← (reveal more items left).
      */}

      {/* Prev — RIGHT side (start-0 = right in RTL) */}
      <button
        onClick={() => scroll("prev")}
        aria-label="قبلی"
        className={`${BTN} inset-s-0 -ms-5`}
      >
        <ChevronRightIcon />
      </button>

      <div
        ref={containerRef}
        className={`flex overflow-x-auto scrollbar-hide gap-4 pb-2 ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        } ${className}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {children}
      </div>

      {/* Next — LEFT side (end-0 = left in RTL) */}
      <button
        onClick={() => scroll("next")}
        aria-label="بعدی"
        className={`${BTN} inset-e-0 -me-5`}
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}
