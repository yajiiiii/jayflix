"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import type { NormalizedContent } from "@/services/content";

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<NormalizedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "movie" | "tv">("all");
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const type = filter === "all" ? "multi" : filter;
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${type}`
        );
        const data = await response.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      }

      setLoading(false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [filter, query]);

  return (
    <div className="min-h-screen px-4 pb-12 pt-24 md:px-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <div className="relative">
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-netflix-light-gray"
            size={20}
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for movies, TV shows..."
            className="w-full rounded-2xl border border-white/10 bg-[rgba(24,24,24,0.92)] py-4 pl-12 pr-4 text-lg text-white outline-none transition focus:border-white/40"
            autoFocus
          />
        </div>

        <div className="mt-4 flex gap-3">
          {(["all", "movie", "tv"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                filter === value
                  ? "bg-white text-black"
                  : "bg-netflix-gray text-netflix-light-gray hover:bg-netflix-gray/80"
              }`}
            >
              {value === "all" ? "All" : value === "movie" ? "Movies" : "TV Shows"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] animate-pulse rounded-xl bg-netflix-gray"
            />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((item) => {
            const watchUrl = getWatchUrl(item);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(watchUrl)}
                onMouseEnter={() => router.prefetch(watchUrl)}
                className="group text-left"
              >
                <div className="relative mb-2 aspect-[2/3] overflow-hidden rounded-xl bg-netflix-gray">
                  {item.poster ? (
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-netflix-light-gray">
                      {item.title}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
                </div>

                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-netflix-light-gray">
                  {item.year ? <span>{item.year}</span> : null}
                  {item.rating > 0 ? (
                    <span className="text-yellow-500">{item.rating.toFixed(1)}</span>
                  ) : null}
                  <span>{item.mediaType === "tv" ? "TV" : "Movie"}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : query.length >= 2 ? (
        <div className="py-24 text-center">
          <p className="text-lg text-netflix-light-gray">No results found for "{query}"</p>
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-lg text-netflix-light-gray">Start typing to search</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24 md:px-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-netflix-red border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
