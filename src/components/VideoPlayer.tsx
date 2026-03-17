"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
    name: "VidSrc CC",
    label: "Primary",
    domain: "https://vidsrc.cc",
    supportsSubtitleLanguage: false,
    buildMovieUrl: ({ imdbId, tmdbId, preferTmdb }) =>
      preferTmdb && tmdbId
        ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=true&poster=false`
        : imdbId
          ? `https://vidsrc.cc/v3/embed/movie/${imdbId}?autoPlay=true&poster=false`
          : tmdbId
            ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=true&poster=false`
            : "",
    buildTvUrl: ({ imdbId, season, episode }) =>
      imdbId
        ? `https://vidsrc.cc/v3/embed/tv/${imdbId}/${season || 1}/${episode || 1}?autoPlay=true&poster=false`
        : "",
  },
  {
    name: "VidSrc Embed",
    label: "Subtitles",
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
    label: "Fast",
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
    label: "Backup",
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
const DEFAULT_SOURCE_INDEX = 0;

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

  const switchSource = (index: number) => {
    setSourceIndex(index);
  };

  const tryNextSource = () => {
    switchSource((sourceIndex + 1) % SOURCES.length);
  };

  const tryPreviousSource = () => {
    switchSource((sourceIndex - 1 + SOURCES.length) % SOURCES.length);
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
    setIsLoading(true);
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
      <div className="relative aspect-video bg-black">
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
                <button
                  type="button"
                  onClick={tryNextSource}
                  className="text-xs text-netflix-light-gray underline transition hover:text-white"
                >
                  Stream not responding? Switch source
                </button>
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
          onLoad={() => setIsLoading(false)}
          referrerPolicy="origin"
          sandbox="allow-forms allow-modals allow-presentation allow-same-origin allow-scripts"
          style={{ WebkitOverflowScrolling: "touch" }}
        />
      </div>
    </motion.div>
  );
}
