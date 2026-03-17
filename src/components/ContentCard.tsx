"use client";

import { startTransition, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiCheck, FiPlay, FiPlus } from "react-icons/fi";
import { useMyList } from "@/context/MyListContext";
import type { NormalizedContent } from "@/services/content";

interface ContentCardProps {
  item: NormalizedContent;
  rank?: number;
}

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

export default function ContentCard({ item, rank }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { isInMyList, toggleMyList } = useMyList();
  const router = useRouter();

  const inList = isInMyList(item.id);
  const watchUrl = getWatchUrl(item);
  const imageSrc = rank !== undefined ? item.poster || item.backdrop : item.backdrop || item.poster;
  const isTopTenCard = rank !== undefined;
  const summary =
    item.overview.length > 110 ? `${item.overview.slice(0, 110)}...` : item.overview;

  const navigateToWatch = () => {
    startTransition(() => router.push(watchUrl));
  };

  const handleHoverStart = () => {
    setIsHovered(true);
    router.prefetch(watchUrl);
  };

  return (
    <article
      className={`relative shrink-0 snap-start ${
        isTopTenCard ? "pl-7 sm:pl-8 md:pl-10 lg:pl-12" : ""
      }`}
      onMouseEnter={handleHoverStart}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleHoverStart}
      onBlur={() => setIsHovered(false)}
    >
      {isTopTenCard ? (
        <span
          className="pointer-events-none absolute bottom-0 left-0 z-10 text-[5.25rem] font-black leading-[0.82] text-transparent sm:text-[6rem] md:text-[7.5rem] lg:text-[8.5rem]"
          style={{
            WebkitTextStroke: "2px rgba(255,255,255,0.82)",
            textShadow: "0 0 18px rgba(0,0,0,0.45)",
          }}
        >
          {rank}
        </span>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={navigateToWatch}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigateToWatch();
          }
        }}
        aria-label={`Open ${item.title}`}
        className={`group relative overflow-hidden rounded-2xl bg-[#1c1c1c] shadow-[0_18px_36px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(0,0,0,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          isTopTenCard
            ? "w-[148px] sm:w-[160px] md:w-[178px] lg:w-[196px]"
            : "w-[220px] sm:w-[240px] md:w-[280px] lg:w-[320px]"
        }`}
      >
        <div className={`relative ${isTopTenCard ? "aspect-[0.72]" : "aspect-video"}`}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              sizes={isTopTenCard ? "220px" : "320px"}
              className={`object-cover transition duration-500 ${
                isHovered ? "scale-[1.04]" : "scale-100"
              }`}
              loading="lazy"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#2c2c2c] p-4 text-center text-sm text-netflix-light-gray">
              {item.title}
            </div>
          )}

          <div
            className={`absolute inset-0 ${
              isTopTenCard
                ? "bg-gradient-to-t from-black/88 via-black/18 to-black/5"
                : "bg-gradient-to-t from-black via-black/25 to-transparent"
            }`}
          />
          <div
            className={`absolute inset-0 border border-white/0 transition ${
              isHovered ? "border-white/15" : ""
            }`}
          />

          {isTopTenCard ? (
            <div className="absolute left-3 top-3 flex h-9 w-9 items-start justify-start">
              <span className="text-[1.75rem] font-black leading-none text-netflix-red drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                N
              </span>
            </div>
          ) : null}

          <div className={`absolute inset-x-0 bottom-0 ${isTopTenCard ? "p-3 md:p-3.5" : "p-3"}`}>
            <p
              className={`truncate font-semibold text-white ${
                isTopTenCard ? "text-sm md:text-[0.95rem]" : "text-sm md:text-base"
              }`}
            >
              {item.title}
            </p>
            {!isTopTenCard ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/75">
                {item.year ? <span>{item.year}</span> : null}
                {item.rating > 0 ? <span>{item.rating.toFixed(1)}</span> : null}
                <span>{item.mediaType === "tv" ? "Series" : "Movie"}</span>
              </div>
            ) : null}
          </div>

          <div
            className={`absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.85)_100%)] transition-opacity md:block ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {isTopTenCard ? (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 md:p-3.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigateToWatch();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/85"
                  aria-label={`Play ${item.title}`}
                >
                  <FiPlay className="fill-current" size={14} />
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMyList(item);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition hover:border-white"
                  aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
                >
                  {inList ? <FiCheck size={16} /> : <FiPlus size={16} />}
                </button>
              </div>
            ) : (
              <>
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigateToWatch();
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/85"
                    aria-label={`Play ${item.title}`}
                  >
                    <FiPlay className="fill-current" size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleMyList(item);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition hover:border-white"
                    aria-label={inList ? `Remove ${item.title} from My List` : `Add ${item.title} to My List`}
                  >
                    {inList ? <FiCheck size={16} /> : <FiPlus size={16} />}
                  </button>
                </div>

                <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
                  {summary ? (
                    <p className="line-clamp-3 text-xs leading-5 text-white/78">
                      {summary}
                    </p>
                  ) : null}

                  {item.genres.length > 0 ? (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                      {item.genres.slice(0, 3).join(" / ")}
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
