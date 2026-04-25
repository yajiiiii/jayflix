"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMaximize2, FiRefreshCw } from "react-icons/fi";

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
    name: "VidSrc.to",
    label: "Primary",
    domain: "https://vidsrc.to",
    supportsSubtitleLanguage: true,
    buildMovieUrl: ({ imdbId, tmdbId, subtitleLanguage, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");

      if (!id) {
        return "";
      }

      const params = new URLSearchParams();

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      const query = params.toString();
      return `https://vidsrc.to/embed/movie/${id}${query ? `?${query}` : ""}`;
    },
    buildTvUrl: ({ imdbId, tmdbId, season, episode, subtitleLanguage, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");

      if (!id) {
        return "";
      }

      const params = new URLSearchParams();

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      const query = params.toString();
      return `https://vidsrc.to/embed/tv/${id}/${season || 1}/${episode || 1}${
        query ? `?${query}` : ""
      }`;
    },
  },
  {
    name: "MoviesAPI",
    label: "Subtitles",
    domain: "https://moviesapi.club",
    supportsSubtitleLanguage: false,
    buildMovieUrl: ({ tmdbId, imdbId, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      return id ? `https://moviesapi.club/movie/${id}` : "";
    },
    buildTvUrl: ({ tmdbId, imdbId, season, episode, preferTmdb }) => {
      const id =
        preferTmdb && tmdbId
          ? String(tmdbId)
          : imdbId || (tmdbId ? String(tmdbId) : "");
      return id
        ? `https://moviesapi.club/tv/${id}-${season || 1}-${episode || 1}`
        : "";
    },
  },
  {
    name: "VidSrc",
    label: "Fast",
    domain: "https://vidsrc.xyz",
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

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrc.xyz/embed/movie?${params.toString()}`;
    },
    buildTvUrl: ({ imdbId, tmdbId, season, episode, subtitleLanguage, preferTmdb }) => {
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

      params.set("season", String(season || 1));
      params.set("episode", String(episode || 1));

      if (subtitleLanguage !== "auto") {
        params.set("ds_lang", subtitleLanguage);
      }

      return `https://vidsrc.xyz/embed/tv?${params.toString()}`;
    },
  },
  {
    name: "111Movies",
    label: "Backup",
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
const DEFAULT_SOURCE_INDEX = 0;
const PLAYER_LOAD_TIMEOUT_MS = 14000;
const IFRAME_ALLOW =
  "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write";
const IFRAME_SANDBOX = [
  "allow-forms",
  "allow-same-origin",
  "allow-scripts",
  "allow-presentation",
].join(" ");

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
  const [loadedFrameKey, setLoadedFrameKey] = useState<string | null>(null);
  const [loadIssue, setLoadIssue] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(DEFAULT_SOURCE_INDEX);
  const [subtitleLanguage, setSubtitleLanguage] = useState("auto");
  const playerRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = null;
  }, []);

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
  const frameKey = `${src}:${reloadNonce}`;
  const isLoading = loadedFrameKey !== frameKey;

  useEffect(() => {
    clearLoadTimeout();
    setLoadIssue(false);

    if (loadedFrameKey === frameKey) {
      return undefined;
    }

    loadTimeoutRef.current = window.setTimeout(() => {
      setLoadIssue(true);
    }, PLAYER_LOAD_TIMEOUT_MS);

    return clearLoadTimeout;
  }, [clearLoadTimeout, frameKey, loadedFrameKey]);

  const switchSource = (index: number) => {
    setSourceIndex(index);
  };

  const tryNextSource = () => {
    setSourceIndex((index) => (index + 1) % SOURCES.length);
  };

  const tryPreviousSource = () => {
    setSourceIndex((index) => (index - 1 + SOURCES.length) % SOURCES.length);
  };

  const cycleSubtitleLanguage = () => {
    if (!currentSource.supportsSubtitleLanguage) {
      return;
    }

    const nextIndex =
      (SUBTITLE_OPTIONS.findIndex((option) => option.value === subtitleLanguage) +
        1) %
      SUBTITLE_OPTIONS.length;

    setSubtitleLanguage(SUBTITLE_OPTIONS[nextIndex]?.value || "auto");
  };

  const reloadSource = () => {
    setLoadIssue(false);
    setReloadNonce((value) => value + 1);
  };

  const toggleFullscreen = async () => {
    if (!playerRef.current) {
      return;
    }

    if (document.fullscreenElement === playerRef.current) {
      await document.exitFullscreen();
      return;
    }

    await playerRef.current.requestFullscreen();
  };

  const handleIframeLoad = () => {
    clearLoadTimeout();
    setLoadIssue(false);
    setLoadedFrameKey(frameKey);
  };

  const handleIframeError = () => {
    clearLoadTimeout();
    setLoadIssue(true);
    setLoadedFrameKey(null);
  };

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
  }, [currentSource.supportsSubtitleLanguage, sourceIndex, subtitleLanguage]);

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
      className="overflow-hidden rounded-xl md:rounded-[1.75rem] border border-white/10 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
    >
      <div className="group/player relative aspect-video bg-black">
        <AnimatePresence>
          {isLoading && !loadIssue ? (
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
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={tryNextSource}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/18"
                  >
                    Switch source
                  </button>
                  <button
                    type="button"
                    onClick={reloadSource}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/18"
                  >
                    Reload
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <iframe
          key={frameKey}
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full touch-manipulation"
          allow={IFRAME_ALLOW}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          referrerPolicy="origin"
          sandbox={IFRAME_SANDBOX}
          style={{ WebkitOverflowScrolling: "touch" }}
        />

        {!isLoading || loadIssue ? (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 transition focus-within:opacity-100 group-hover/player:opacity-100 ${
              loadIssue ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-full border border-white/12 bg-black/62 p-1 backdrop-blur">
              {loadIssue ? (
                <span className="px-3 py-1.5 text-[11px] font-semibold text-white/72">
                  Source slow
                </span>
              ) : null}
              {SOURCES.map((source, index) => (
                <button
                  key={source.name}
                  type="button"
                  onClick={() => switchSource(index)}
                  aria-pressed={sourceIndex === index}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                    sourceIndex === index
                      ? "bg-white text-black"
                      : "text-white/72 hover:bg-white/12 hover:text-white"
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {currentSource.supportsSubtitleLanguage ? (
                <button
                  type="button"
                  onClick={cycleSubtitleLanguage}
                  className="rounded-full border border-white/12 bg-black/62 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-white/12"
                  aria-label={`Subtitle language: ${selectedSubtitle.label}`}
                >
                  CC {selectedSubtitle.label}
                </button>
              ) : null}
              <button
                type="button"
                onClick={reloadSource}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/62 text-white backdrop-blur transition hover:bg-white/12"
                aria-label="Reload source"
              >
                <FiRefreshCw size={15} />
              </button>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-black/62 text-white backdrop-blur transition hover:bg-white/12"
                aria-label="Fullscreen"
              >
                <FiMaximize2 size={15} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
