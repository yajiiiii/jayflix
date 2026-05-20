"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiMaximize2,
  FiMinimize2,
  FiRefreshCw,
  FiSettings,
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
    domain: "https://111movies.net",
    supportsSubtitleLanguage: false,
    buildMovieUrl: ({ tmdbId, imdbId }) => {
      const id = tmdbId ? String(tmdbId) : imdbId;
      return id ? `https://111movies.net/movie/${id}` : "";
    },
    buildTvUrl: ({ tmdbId, imdbId, season, episode }) => {
      const id = tmdbId ? String(tmdbId) : imdbId;
      return id
        ? `https://111movies.net/tv/${id}/${season || 1}/${episode || 1}`
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
  const usesEmbeddedSubtitleControls = currentSource.name === "111Movies";

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
          ? "relative h-screen w-screen rounded-none border-0 shadow-none"
          : "flex flex-col rounded-xl md:rounded-[1.75rem]"
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
                  <p className="text-sm font-semibold text-white">
                    Loading {currentSource.label}
                  </p>
                  <p className="text-xs text-netflix-light-gray">
                    {currentSource.name}
                  </p>
                </div>
                <p className="text-xs text-netflix-light-gray">
                  If this source stalls, switch servers below.
                </p>
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

      </div>

      <div
        className={`${
          isFullscreen
            ? "hidden"
            : "shrink-0 border-t border-white/10 bg-[#080808] px-3 py-2"
        }`}
      >
        <div
          className={
            isFullscreen
              ? "flex items-center gap-1"
              : "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <div
            className={`min-w-0 items-center gap-3 ${
              isFullscreen ? "hidden" : "flex"
            }`}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.18em] text-white/38">
                Source
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-white">
                {currentSource.label} / {currentSource.name}
              </p>
            </div>
            <label className="sr-only" htmlFor="video-source-select">
              Video source
            </label>
            <select
              id="video-source-select"
              value={sourceIndex}
              onChange={(event) => switchSource(Number(event.target.value))}
              className="h-9 rounded-full border border-white/10 bg-white/8 px-3 text-xs font-semibold text-white outline-none transition hover:bg-white/12 focus:border-white/35"
            >
              {SOURCE_PRIORITY.map((sourceId) => {
                const source = SOURCES[sourceId];

                return (
                  <option key={source.name} value={sourceId} className="bg-black">
                    {source.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div
            className={`flex items-center gap-1 ${
              isFullscreen ? "" : "self-end sm:self-auto"
            }`}
          >
            {usesEmbeddedSubtitleControls ? (
              <div
                className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/74"
                title="Use the CC or settings button inside the video player."
              >
                <FiSettings size={16} />
                <span className="hidden sm:inline">Audio/subtitles in player</span>
              </div>
            ) : currentSource.supportsSubtitleLanguage ? (
              <div className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/74 transition hover:bg-white/10 hover:text-white">
                <FiType size={16} />
                <label className="sr-only" htmlFor="subtitle-language-select">
                  Subtitle language
                </label>
                <select
                  id="subtitle-language-select"
                  value={subtitleLanguage}
                  onChange={(event) => setSubtitleLanguage(event.target.value)}
                  aria-label={`Subtitle language: ${selectedSubtitle.label}`}
                  title={`Subtitle language: ${selectedSubtitle.label}`}
                  className="h-full max-w-24 bg-transparent text-xs font-semibold text-white outline-none"
                >
                  {SUBTITLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <button
              type="button"
              onClick={reloadSource}
              aria-label="Reload source"
              title="Reload source"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/74 transition hover:bg-white/10 hover:text-white"
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
    </motion.div>
  );
}
