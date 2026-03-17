"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck, FiPlay, FiPlus } from "react-icons/fi";
import VideoPlayer from "@/components/VideoPlayer";
import EpisodeSelector from "@/components/EpisodeSelector";
import { useMyList } from "@/context/MyListContext";
import type { CastMember } from "@/services/fmdb";
import type { NormalizedContent } from "@/services/content";

interface WatchClientProps {
  details: NormalizedContent;
  id: string;
  type: "movie" | "tv";
}

function getInitialSeason(details: NormalizedContent): number {
  return details.seasons?.find((season) => season.number > 0)?.number || 1;
}

export default function WatchClient({
  details,
  id,
  type,
}: WatchClientProps) {
  const [selectedSeason, setSelectedSeason] = useState(getInitialSeason(details));
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const { isInMyList, toggleMyList } = useMyList();
  const router = useRouter();

  const isTV = type === "tv";
  const inList = isInMyList(details.id);
  const playerId = details.imdbId || "";
  const canPlay = Boolean(playerId || details.tmdbId);
  const cast: CastMember[] =
    details.cast && details.cast.length > 0
      ? details.cast
      : details.castMembers && details.castMembers.length > 0
        ? details.castMembers.map((member, index) => ({
            id: `fallback-cast-${index}`,
            name: member,
            role: undefined,
            photo: null,
          }))
        : details.actors
          ? details.actors
              .split(",")
              .map((member) => member.trim())
              .filter(Boolean)
              .map((member, index) => ({
                id: `fallback-actor-${index}`,
                name: member,
                role: undefined,
                photo: null,
              }))
          : [];
  const fullCast = Array.from(
    new Map(cast.map((member) => [member.name.toLowerCase(), member])).values()
  );
  const playbackLabel = isTV
    ? `Season ${selectedSeason}, Episode ${selectedEpisode}`
    : "";
  const detailLabel = isTV ? "Now Watching Series" : "Now Watching Movie";
  const bannerImage = details.backdrop || details.poster;
  const prefersTmdbPlayback =
    type === "movie" &&
    Boolean(details.tmdbId) &&
    /philippines/i.test(details.country || "");

  return (
    <div className="min-h-screen bg-netflix-black pb-16">
      <div className="absolute inset-x-0 top-0 h-[380px] overflow-hidden">
        {bannerImage ? (
          <Image
            src={bannerImage}
            alt={details.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
            unoptimized
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.78)_64%,#141414_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.2),transparent_34%)]" />
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="fixed left-4 top-20 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur transition hover:bg-black/85 md:left-8"
        aria-label="Go back"
      >
        <FiArrowLeft size={20} />
      </button>

      <div className="relative z-10 px-4 pt-24 md:px-12">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <div className="mx-auto max-w-[1080px]">
            {canPlay ? (
              <VideoPlayer
                imdbId={playerId}
                tmdbId={details.tmdbId}
                type={type}
                season={isTV ? selectedSeason : undefined}
                episode={isTV ? selectedEpisode : undefined}
                preferTmdb={prefersTmdbPlayback}
                title={details.title}
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#111111] shadow-[0_28px_70px_rgba(0,0,0,0.45)]">
                <div className="max-w-md space-y-3 px-6 text-center">
                  <p className="text-lg font-semibold text-white">
                    Stream unavailable
                  </p>
                  <p className="text-sm text-netflix-light-gray">
                    This title does not currently have a playable external
                    source.
                  </p>
                </div>
              </div>
            )}
          </div>

          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#1a1a1a_0%,#121212_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[2.1/1] min-h-[240px] overflow-hidden md:aspect-[2.9/1]">
              {bannerImage ? (
                <Image
                  src={bannerImage}
                  alt={details.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.32),transparent_32%),linear-gradient(135deg,#242424_0%,#111111_100%)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.94)_0%,rgba(10,10,10,0.72)_38%,rgba(10,10,10,0.34)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.18)_36%,rgba(10,10,10,0.9)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 lg:p-10">
                <div className="max-w-4xl space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">
                    {detailLabel}
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <h1 className="text-3xl font-black tracking-[-0.04em] text-white md:text-5xl lg:text-6xl">
                      {details.title}
                    </h1>
                    {playbackLabel ? (
                      <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-white/80 backdrop-blur">
                        {playbackLabel}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {details.rating > 0 ? (
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/92">
                        {details.rating.toFixed(1)}
                      </span>
                    ) : null}
                    {details.year ? (
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/92">
                        {details.year}
                      </span>
                    ) : null}
                    {details.duration ? (
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/92">
                        {details.duration}
                      </span>
                    ) : null}
                    {details.contentRating ? (
                      <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/92">
                        {details.contentRating}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/92">
                      {isTV ? "Series" : "Movie"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:p-10">
              <div className="mx-auto w-full max-w-[180px]">
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#222]">
                  {details.poster ? (
                    <Image
                      src={details.poster}
                      alt={details.title}
                      fill
                      sizes="180px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-netflix-light-gray">
                      {details.title}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {details.overview ? (
                  <p className="max-w-4xl text-sm leading-7 text-white/82 md:text-base">
                    {details.overview}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleMyList(details)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/88"
                  >
                    {inList ? <FiCheck size={16} /> : <FiPlus size={16} />}
                    {inList ? "In My List" : "Add to My List"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(type === "movie" ? "/movies" : "/tv-shows")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
                  >
                    <FiPlay size={14} className="fill-current" />
                    Browse More
                  </button>
                </div>

                {(details.director || details.country) && (
                  <div className="grid gap-2 text-sm text-netflix-light-gray sm:grid-cols-2">
                    {details.director ? (
                      <p>
                        <span className="text-white/65">Director:</span>{" "}
                        {details.director}
                      </p>
                    ) : null}
                    {details.country ? (
                      <p>
                        <span className="text-white/65">Country:</span>{" "}
                        {details.country}
                      </p>
                    ) : null}
                  </div>
                )}

                {details.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {fullCast.length > 0 ? (
              <div className="border-t border-white/10 p-5 md:p-8 lg:p-10">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white md:text-xl">
                      Cast
                    </h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {fullCast.length} {fullCast.length === 1 ? "Artist" : "Artists"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {fullCast.map((member) => (
                      <div
                        key={member.id}
                        className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-3"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-[0.95rem] bg-[#1f1f1f]">
                          {member.photo || details.poster || details.backdrop ? (
                            <Image
                              src={member.photo || details.poster || details.backdrop || ""}
                              alt={member.name}
                              fill
                              sizes="(min-width: 1536px) 10vw, (min-width: 1280px) 12vw, (min-width: 768px) 18vw, 44vw"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.28),transparent_48%),linear-gradient(180deg,#2a2a2a_0%,#191919_100%)]" />
                          )}
                        </div>
                        <div className="mt-3 min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {member.name}
                          </p>
                          <p className="line-clamp-2 text-[11px] uppercase tracking-[0.12em] text-white/45">
                            {member.role || "Cast"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {isTV && details.seasons && details.seasons.length > 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#181818] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.3)] md:p-8">
              <EpisodeSelector
                tvId={Number.parseInt(id, 10)}
                seasons={details.seasons}
                currentSeason={selectedSeason}
                currentEpisode={selectedEpisode}
                onSelectEpisode={(season, episode) => {
                  setSelectedSeason(season);
                  setSelectedEpisode(episode);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
