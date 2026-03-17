"use client";

import { startTransition, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiInfo, FiPlay } from "react-icons/fi";
import type { NormalizedContent } from "@/services/content";

interface HeroBannerProps {
  items: NormalizedContent[];
}

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  const featured = items[currentIndex];
  const watchUrl = featured ? getWatchUrl(featured) : "/";

  useEffect(() => {
    if (items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % items.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    setShowInfo(false);
  }, [featured?.id]);

  useEffect(() => {
    if (featured) {
      router.prefetch(watchUrl);
    }
  }, [featured, router, watchUrl]);

  if (!featured) {
    return (
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.28),_transparent_30%),linear-gradient(180deg,_#181818_0%,_#0b0b0b_100%)] px-4 pb-20 pt-28 md:px-12">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Jayflix Tonight
          </p>
          <h1 className="max-w-xl text-4xl font-black text-white md:text-6xl">
            Your next watchlist is loading.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-netflix-light-gray md:text-base">
            Refresh in a second while the catalog reconnects.
          </p>
        </div>
      </section>
    );
  }

  const heroImage = featured.backdrop || featured.poster;
  const metadata = [
    featured.rating > 0 ? featured.rating.toFixed(1) : null,
    featured.year || null,
    featured.duration || null,
    featured.country || null,
    featured.mediaType === "tv" ? "Series" : "Film",
  ].filter(Boolean);
  const eyebrow = "CAN'T FIND? JUST SEARCH IT!";

  return (
    <section className="relative min-h-[78vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={featured.id}
          initial={{ opacity: 0.4, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.4, scale: 1.01 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {heroImage ? (
            <Image
              src={heroImage}
              alt={featured.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.32),_transparent_24%),linear-gradient(135deg,_#1b1b1b_0%,_#090909_100%)]" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,_rgba(7,7,7,0.92)_0%,_rgba(7,7,7,0.72)_32%,_rgba(7,7,7,0.18)_62%,_rgba(7,7,7,0.5)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,0.18)_0%,_rgba(0,0,0,0.2)_55%,_#141414_100%)]" />

      <div className="relative z-10 flex min-h-[78vh] items-end px-4 pb-32 pt-32 md:px-12 md:pb-36">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            {eyebrow}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${featured.id}-content`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="max-w-xl text-4xl font-black leading-[0.95] text-white md:text-6xl lg:text-7xl">
                {featured.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                {metadata.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/85 md:text-base md:leading-7">
                {featured.overview
                  ? featured.overview.slice(0, 220) +
                    (featured.overview.length > 220 ? "..." : "")
                  : "A featured pick ready to stream right now."}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTransition(() => router.push(watchUrl))}
                  className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85 md:px-8 md:text-base"
                >
                  <FiPlay className="fill-current" />
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => setShowInfo((open) => !open)}
                  className="inline-flex items-center gap-2 rounded bg-white/16 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/24 md:px-8 md:text-base"
                >
                  <FiInfo />
                  More Info
                </button>
              </div>

              <AnimatePresence>
                {showInfo ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-5 max-w-xl rounded-2xl border border-white/10 bg-[rgba(20,20,20,0.72)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                  >
                    <p className="text-sm leading-6 text-white/85">
                      {featured.overview || "More details are coming soon for this title."}
                    </p>
                    {featured.genres.length > 0 ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/55">
                        {featured.genres.slice(0, 4).join(" / ")}
                      </p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {items.length > 1 ? (
        <div className="absolute bottom-16 right-4 z-10 flex gap-2 md:right-12 md:bottom-20">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-white" : "w-3 bg-white/35"
              }`}
              aria-label={`Show ${item.title}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
