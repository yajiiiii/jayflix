"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiPlay } from "react-icons/fi";
import type { TVMazeSeason, TVMazeEpisode } from "@/services/content";

interface EpisodeSelectorProps {
  tvId: number;
  seasons: TVMazeSeason[];
  onSelectEpisode: (season: number, episode: number) => void;
  currentSeason?: number;
  currentEpisode?: number;
}

export default function EpisodeSelector({
  tvId,
  seasons,
  onSelectEpisode,
  currentSeason = 1,
  currentEpisode = 1,
}: EpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [episodes, setEpisodes] = useState<TVMazeEpisode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEpisodes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tv/${tvId}/season/${selectedSeason}`);
        const data = await res.json();
        setEpisodes(data.episodes || []);
      } catch {
        setEpisodes([]);
      }
      setLoading(false);
    }
    fetchEpisodes();
  }, [tvId, selectedSeason]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl font-semibold">Episodes</h3>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
          className="bg-netflix-dark border border-netflix-gray text-white px-3 py-2 rounded text-sm outline-none cursor-pointer"
        >
          {seasons.map((season) => (
            <option key={season.number} value={season.number}>
              {season.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-40 h-24 bg-netflix-gray rounded" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-netflix-gray rounded mb-2" />
                <div className="h-3 w-full bg-netflix-gray rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {episodes.map((ep) => {
            const isPlaying =
              ep.season === currentSeason && ep.number === currentEpisode;
            return (
              <button
                key={ep.id}
                onClick={() => onSelectEpisode(ep.season, ep.number)}
                className={`flex items-start gap-4 w-full p-3 rounded hover:bg-netflix-gray/50 transition text-left ${
                  isPlaying ? "bg-netflix-gray/30" : ""
                }`}
              >
                <span className="text-netflix-light-gray text-lg w-8 text-center flex-shrink-0 mt-6">
                  {ep.number}
                </span>
                <div className="relative w-32 md:w-40 aspect-video flex-shrink-0 rounded overflow-hidden bg-netflix-gray">
                  {ep.image?.medium ? (
                    <Image
                      src={ep.image.medium}
                      alt={ep.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiPlay className="text-netflix-light-gray" size={24} />
                    </div>
                  )}
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <FiPlay className="text-black fill-current" size={16} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium text-sm truncate">
                      {ep.name}
                    </p>
                    {ep.runtime > 0 && (
                      <span className="text-netflix-light-gray text-xs flex-shrink-0 ml-2">
                        {ep.runtime}m
                      </span>
                    )}
                  </div>
                  <p className="text-netflix-light-gray text-xs mt-1 line-clamp-2">
                    {ep.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
