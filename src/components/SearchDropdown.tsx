"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { NormalizedContent } from "@/services/content";

interface SearchDropdownProps {
  query: string;
  onSelect: () => void;
}

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

export default function SearchDropdown({
  query,
  onSelect,
}: SearchDropdownProps) {
  const [results, setResults] = useState<NormalizedContent[]>([]);
  const [loading, setLoading] = useState(false);
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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results?.slice(0, 8) || []);
      } catch {
        setResults([]);
      }

      setLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  if (query.length < 2) {
    return null;
  }

  return (
    <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,18,18,0.98)] shadow-[0_24px_50px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      {loading ? (
        <div className="p-4 text-sm text-netflix-light-gray">Searching...</div>
      ) : null}

      {!loading && results.length === 0 ? (
        <div className="p-4 text-sm text-netflix-light-gray">
          No results for "{query}"
        </div>
      ) : null}

      {results.map((item) => {
        const watchUrl = getWatchUrl(item);

        return (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/6"
            onMouseEnter={() => router.prefetch(watchUrl)}
            onMouseDown={(event) => {
              event.preventDefault();
              router.push(watchUrl);
              onSelect();
            }}
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-[#2a2a2a]">
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-xs text-netflix-light-gray">
                {item.mediaType === "tv" ? "TV Show" : "Movie"}
                {item.year ? `  ${item.year}` : ""}
                {item.rating > 0 ? `  ${item.rating.toFixed(1)}` : ""}
              </p>
            </div>
          </button>
        );
      })}

      {results.length > 0 ? (
        <button
          type="button"
          className="w-full border-t border-white/10 px-4 py-3 text-left text-sm text-netflix-light-gray transition hover:bg-white/6 hover:text-white"
          onMouseDown={(event) => {
            event.preventDefault();
            router.push(`/search?q=${encodeURIComponent(query)}`);
            onSelect();
          }}
        >
          See all results for "{query}"
        </button>
      ) : null}
    </div>
  );
}
