"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ContentCard from "./ContentCard";
import type { NormalizedContent } from "@/services/content";

interface ContentRowProps {
  title: string;
  items: NormalizedContent[];
  isTopTen?: boolean;
}

export default function ContentRow({
  title,
  items,
  isTopTen = false,
}: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateArrows = useCallback(() => {
    if (!rowRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 8);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [items.length, updateArrows]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateArrows());
    observer.observe(row);

    return () => observer.disconnect();
  }, [items.length, updateArrows]);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) {
      return;
    }

    const scrollAmount = Math.max(rowRef.current.clientWidth - 120, 260);
    const nextScroll =
      direction === "left"
        ? rowRef.current.scrollLeft - scrollAmount
        : rowRef.current.scrollLeft + scrollAmount;

    rowRef.current.scrollTo({ left: nextScroll, behavior: "smooth" });
  };

  if (!items.length) {
    return null;
  }

  return (
    <section
      className={`group/row relative ${
        isTopTen ? "space-y-4 md:space-y-5" : "space-y-3 md:space-y-4"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 xl:px-16">
        <h2 className="text-[1.8rem] font-bold tracking-[-0.03em] text-white md:text-[2rem]">
          {title}
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-gradient-to-r from-[#141414] via-[#141414]/75 to-transparent md:block xl:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-[#141414] via-[#141414]/75 to-transparent md:block xl:w-24" />

        {showLeftArrow ? (
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/85 group-hover/row:opacity-100 md:flex xl:left-5"
            aria-label={`Scroll ${title} left`}
          >
            <FiChevronLeft size={22} />
          </button>
        ) : null}

        {showRightArrow ? (
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/85 group-hover/row:opacity-100 md:flex xl:right-5"
            aria-label={`Scroll ${title} right`}
          >
            <FiChevronRight size={22} />
          </button>
        ) : null}

        <div
          ref={rowRef}
          onScroll={updateArrows}
          className={`scrollbar-hide flex snap-x snap-proximity overflow-x-auto overscroll-x-contain px-4 pb-4 md:px-12 md:pb-5 xl:px-16 ${
            isTopTen
              ? "gap-4 pt-2 md:gap-6 md:pt-3 md:pb-7"
              : "gap-3 md:gap-4 xl:gap-5"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => (
            <ContentCard
              key={item.id}
              item={item}
              rank={isTopTen ? index + 1 : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
