"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiMinimize2,
  FiRefreshCw,
  FiType,
} from "react-icons/fi";

interface VideoSource {
  buildMovieUrl: (options: VideoUrlOptions) => string;
  buildTvUrl: (options: VideoUrlOptions) => string;
  domain: string;
  label: string;
  name: string;
  supportsSubtitleLanguage: boolean;
}

interface SubtitleOption {
  label: string;
  value: string;
}

interface VideoPlayerProps {
  imdbId: string;
  tmdbId?: number;
  type: "movie" | "tv";
  season?: number;
  episode?: number;
  preferTmdb?: boolean;
  title: string;
}

interface VideoUrlOptions {
  episode?: number;
  imdbId: string;
  preferTmdb?: boolean;
  season?: number;
  subtitleLanguage: string;
  tmdbId?: number;
}

const SOURCES: VideoSource[] = [
  {
    name: "VidSrc",
    label: "Server 7",
    domain: "https://vidsrc.xyz",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const params = new URLSearchParams();
      if (preferTmdb && tmdbId) params.set("tmdb", String(tmdbId));
      else if (imdbId) params.set("imdb", imdbId);
      else if (tmdbId) params.set("tmdb", String(tmdbId));
      else return "";
      if (subtitleLanguage !== "auto") params.set("ds_lang", subtitleLanguage);
      return `https://vidsrc.xyz/embed/movie?${params.toString()}`;
    },
    buildTvUrl: ({ imdbId, tmdbId, season, episode, subtitleLanguage, preferTmdb }) => {
      const params = new URLSearchParams();
      if (preferTmdb && tmdbId) params.set("tmdb", String(tmdbId));
      else if (imdbId) params.set("imdb", imdbId);
      else if (tmdbId) params.set("tmdb", String(tmdbId));
      else return "";
      params.set("season", String(season || 1));
      params.set("episode", String(episode || 1));
      if (subtitleLanguage !== "auto") params.set("ds_lang", subtitleLanguage);
      return `https://vidsrc.xyz/embed/tv?${params.toString()}`;
    },
  },
  {
    name: "VidSrc.to",
    label: "Server 6",
    domain: "https://vidsrc.to",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      if (!id) return "";
      const params = new URLSearchParams();
      if (subtitleLanguage !== "auto") params.set("ds_lang", subtitleLanguage);
      const query = params.toString();
      return `https://vidsrc.to/embed/movie/${id}${query ? `?${query}` : ""}`;
    },
    buildTvUrl: ({ imdbId, tmdbId, season, episode, subtitleLanguage, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      if (!id) return "";
      const params = new URLSearchParams();
      if (subtitleLanguage !== "auto") params.set("ds_lang", subtitleLanguage);
      const query = params.toString();
      return `https://vidsrc.to/embed/tv/${id}/${season || 1}/${episode || 1}${
        query ? `?${query}` : ""
      }`;
    },
  },
  {
    name: "111Movies",
    label: "Server 1",
    domain: "https://111movies.com",
    supportsSubtitleLanguage: false,
    buildMovieUrl: ({ tmdbId, imdbId, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      return id ? `https://111movies.com/movie/${id}` : "";
    },
    buildTvUrl: ({ tmdbId, imdbId, season, episode, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      return id
        ? `https://111movies.com/tv/${id}/${season || 1}/${episode || 1}`
        : "";
    },
  },
  {
    name: "VidSrc CC",
    label: "Server 2",
    domain: "https://vidsrc.cc",
    supportsSubtitleLanguage: false,
    buildMovieUrl: ({ imdbId, tmdbId }) =>
      tmdbId
        ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=true&poster=false`
        : imdbId
          ? `https://vidsrc.cc/v3/embed/movie/${imdbId}?autoPlay=true&poster=false`
          : "",
    buildTvUrl: ({ imdbId, season, episode }) =>
      imdbId
        ? `https://vidsrc.cc/v3/embed/tv/${imdbId}/${season || 1}/${episode || 1}?autoPlay=true&poster=false`
        : "",
  },
  {
    name: "VidSrc Embed",
    label: "Server 4",
    domain: "https://vidsrc-embed.su",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const params = new URLSearchParams();

      if (preferTmdb && tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else if (imdbId) {
        params.set("imdb", imdbId);
      } else if (tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else {
        return "";
      }

      params.set("autoplay", "1");

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrc-embed.su/embed/movie?${params.toString()}`;
    },
    buildTvUrl: ({ imdbId, season, episode, subtitleLanguage }) => {
      if (!imdbId) {
        return "";
      }

      const params = new URLSearchParams({
        imdb: imdbId,
        season: String(season || 1),
        episode: String(episode || 1),
        autoplay: "1",
        autonext: "1",
      });

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrc-embed.su/embed/tv?${params.toString()}`;
    },
  },
  {
    name: "Vsrc",
    label: "Server 5",
    domain: "https://vsrc.su",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const params = new URLSearchParams();

      if (preferTmdb && tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else if (imdbId) {
        params.set("imdb", imdbId);
      } else if (tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else {
        return "";
      }

      params.set("autoplay", "1");

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vsrc.su/embed/movie?${params.toString()}`;
    },
    buildTvUrl: ({ imdbId, season, episode, subtitleLanguage }) => {
      if (!imdbId) {
        return "";
      }

      const params = new URLSearchParams({
        imdb: imdbId,
        season: String(season || 1),
        episode: String(episode || 1),
        autoplay: "1",
        autonext: "1",
      });

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vsrc.su/embed/tv?${params.toString()}`;
    },
  },
  {
    name: "VidSrc Mirror",
    label: "Server 3",
    domain: "https://vidsrcme.su",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const params = new URLSearchParams();

      if (preferTmdb && tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else if (imdbId) {
        params.set("imdb", imdbId);
      } else if (tmdbId) {
        params.set("tmdb", String(tmdbId));
      } else {
        return "";
      }

      params.set("autoplay", "1");

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrcme.su/embed/movie?${params.toString()}`;
    },
    buildTvUrl: ({ imdbId, season, episode, subtitleLanguage }) => {
      if (!imdbId) {
        return "";
      }

      const params = new URLSearchParams({
        imdb: imdbId,
        season: String(season || 1),
        episode: String(episode || 1),
        autoplay: "1",
        autonext: "1",
      });

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrcme.su/embed/tv?${params.toString()}`;
    },
  },
];

const SUBTITLE_OPTIONS: SubtitleOption[] = [
  { value: "auto", label: "Auto" },
  { value: "en", label: "English" },
  { value: "tl", label: "Filipino" },
  { value: "es", label: "Spanish" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

const PLAYER_SUBTITLE_KEY = "netflix-clone-player-subtitle";
const PLAYER_LOAD_TIMEOUT_MS = 3500;
const SOURCE_PRIORITY = [2, 3, 6, 4, 5, 1, 0];
const DEFAULT_SOURCE_INDEX = SOURCE_PRIORITY[0] ?? 0;

function getAdjacentSourceIndex(currentIndex: number, direction: 1 | -1): number {
  const currentPriorityIndex = SOURCE_PRIORITY.indexOf(currentIndex);

  if (currentPriorityIndex === -1) {
    return DEFAULT_SOURCE_INDEX;
  }

  return SOURCE_PRIORITY[
    (currentPriorityIndex + direction + SOURCE_PRIORITY.length) %
      SOURCE_PRIORITY.length
  ];
}

function buildPlayerUrl(
  source: VideoSource,
  options: VideoUrlOptions & { type: "movie" | "tv" }
): string {
  return options.type === "movie"
    ? source.buildMovieUrl(options)
    : source.buildTvUrl(options);
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable
  );
}

export default function VideoPlayer({
  imdbId,
  tmdbId,
  type,
  season,
  episode,
  preferTmdb = false,
  title,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(DEFAULT_SOURCE_INDEX);
  const [subtitleLanguage, setSubtitleLanguage] = useState("auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSubtitle = window.localStorage.getItem(PLAYER_SUBTITLE_KEY);

    if (
      savedSubtitle &&
      SUBTITLE_OPTIONS.some((option) => option.value === savedSubtitle)
    ) {
      setSubtitleLanguage(savedSubtitle);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PLAYER_SUBTITLE_KEY, subtitleLanguage);
  }, [subtitleLanguage]);

  useEffect(() => {
    setSourceIndex(DEFAULT_SOURCE_INDEX);
    setReloadNonce(0);
  }, [episode, imdbId, season, tmdbId, type]);

  const currentSource = SOURCES[sourceIndex];
  const selectedSubtitle =
    SUBTITLE_OPTIONS.find((option) => option.value === subtitleLanguage) ??
    SUBTITLE_OPTIONS[0];

  const src = useMemo(
    () =>
      buildPlayerUrl(currentSource, {
        imdbId,
        preferTmdb,
        tmdbId,
        type,
        season,
        episode,
        subtitleLanguage,
      }),
    [currentSource, episode, imdbId, preferTmdb, season, subtitleLanguage, tmdbId, type]
  );

  useEffect(() => {
    setIsLoading(true);
  }, [reloadNonce, src]);

  const switchSource = useCallback((index: number) => {
    setIsLoading(true);
    setSourceIndex(index);
  }, []);

  const tryNextSource = useCallback(() => {
    setIsLoading(true);
    setSourceIndex((index) => getAdjacentSourceIndex(index, 1));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, PLAYER_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading, src]);

  const tryPreviousSource = useCallback(() => {
    setIsLoading(true);
    setSourceIndex((index) => getAdjacentSourceIndex(index, -1));
  }, []);

  const cycleSubtitleLanguage = useCallback(() => {
    if (!currentSource.supportsSubtitleLanguage) {
      return;
    }

    const nextIndex =
      (SUBTITLE_OPTIONS.findIndex((option) => option.value === subtitleLanguage) +
        1) %
      SUBTITLE_OPTIONS.length;

    setSubtitleLanguage(SUBTITLE_OPTIONS[nextIndex]?.value || "auto");
  }, [currentSource.supportsSubtitleLanguage, subtitleLanguage]);

  const reloadSource = useCallback(() => {
    setIsLoading(true);
    setReloadNonce((value) => value + 1);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement === playerRef.current) {
        await document.exitFullscreen();
        return;
      }

      await playerRef.current.requestFullscreen();
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          tryPreviousSource();
          break;
        case "ArrowRight":
          event.preventDefault();
          tryNextSource();
          break;
        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;
        case "s":
        case "S":
          event.preventDefault();
          tryNextSource();
          break;
        case "c":
        case "C":
          event.preventDefault();
          cycleSubtitleLanguage();
          break;
        case "r":
        case "R":
          event.preventDefault();
          reloadSource();
          break;
        case "Escape":
          if (document.fullscreenElement === playerRef.current) {
            void document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cycleSubtitleLanguage,
    reloadSource,
    toggleFullscreen,
    tryNextSource,
    tryPreviousSource,
  ]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-[1.5rem] border border-white/10 bg-black">
        <p className="px-6 text-center text-sm text-netflix-light-gray">
          No streaming source is available for this title yet.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={playerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group overflow-hidden border border-white/10 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.45)] ${
        isFullscreen
          ? "h-screen w-screen rounded-none"
          : "rounded-xl md:rounded-[1.75rem]"
      }`}
    >
      <div
        className={`relative bg-black ${
          isFullscreen ? "h-screen w-screen" : "aspect-video"
        }`}
      >
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black"
            >
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-netflix-red border-t-transparent" />
                <div className="space-y-1">
                  <p className="text-sm text-white">Loading {currentSource.name}</p>
                  {currentSource.supportsSubtitleLanguage ? (
                    <p className="text-xs text-netflix-light-gray">
                      Subtitle track: {selectedSubtitle.label}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-netflix-light-gray">
                  Stream not responding? Try a different source:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {SOURCE_PRIORITY.map((sourceId) => {
                    const source = SOURCES[sourceId];

                    return (
                      <button
                        key={source.name}
                        type="button"
                        onClick={() => switchSource(sourceId)}
                        aria-pressed={sourceIndex === sourceId}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                          sourceIndex === sourceId
                            ? "bg-white text-black"
                            : "border border-white/15 bg-white/8 text-white/80 hover:bg-white/16 hover:text-white"
                        }`}
                      >
                        {source.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <iframe
          key={`${src}:${reloadNonce}`}
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full touch-manipulation"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          referrerPolicy="origin"
          style={{ WebkitOverflowScrolling: "touch" }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <div className="flex items-center justify-between gap-3">
            <div className="pointer-events-auto flex min-w-0 items-center rounded-full border border-white/10 bg-black/70 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <button
                type="button"
                onClick={tryPreviousSource}
                aria-label="Previous source"
                title="Previous source"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/78 transition hover:bg-white/12 hover:text-white"
              >
                <FiChevronLeft size={18} />
              </button>
              <div className="min-w-0 px-2 text-center">
                <p className="text-[11px] font-semibold uppercase leading-none text-white">
                  {currentSource.label}
                </p>
                <p className="mt-1 max-w-[104px] truncate text-[10px] leading-none text-white/48 sm:max-w-[150px]">
                  {currentSource.name}
                </p>
              </div>
              <button
                type="button"
                onClick={tryNextSource}
                aria-label="Next source"
                title="Next source"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/78 transition hover:bg-white/12 hover:text-white"
              >
                <FiChevronRight size={18} />
              </button>
            </div>

            <div className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
              {currentSource.supportsSubtitleLanguage ? (
                <button
                  type="button"
                  onClick={cycleSubtitleLanguage}
                  aria-label={`Subtitle language: ${selectedSubtitle.label}`}
                  title={`Subtitle language: ${selectedSubtitle.label}`}
                  className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2 text-white/78 transition hover:bg-white/12 hover:text-white"
                >
                  <FiType size={16} />
                  <span className="text-[10px] font-semibold uppercase leading-none">
                    {selectedSubtitle.value}
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={reloadSource}
                aria-label="Reload source"
                title="Reload source"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/78 transition hover:bg-white/12 hover:text-white"
              >
                <FiRefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/86"
              >
                {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
