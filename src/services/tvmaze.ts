// TVMaze API - Free TV Show Database (no API key required)
// https://api.tvmaze.com

import type {
  CastMember,
  NormalizedContent,
  TVMazeSeason,
  TVMazeEpisode,
} from "./fmdb";

const TVMAZE_BASE = "https://api.tvmaze.com";
const TVMAZE_REVALIDATE = 60 * 60 * 6;
const TVMAZE_SEARCH_REVALIDATE = 60 * 30;

export interface TVMazeShow {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number;
  averageRuntime: number;
  premiered: string;
  ended: string | null;
  officialSite: string | null;
  rating: { average: number | null };
  weight: number;
  network: { name: string } | null;
  image: { medium: string; original: string } | null;
  summary: string | null;
  externals: { imdb: string | null };
  _embedded?: {
    episodes?: TVMazeRawEpisode[];
    cast?: TVMazeCastMember[];
  };
}

export interface TVMazeRawEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  runtime: number;
  image: { medium: string; original: string } | null;
  summary: string | null;
}

export interface TVMazeCastMember {
  person: { name: string; image: { medium: string } | null };
  character: { name: string };
}

export interface TVMazeSearchResult {
  score: number;
  show: TVMazeShow;
}

export interface TVMazeRawSeason {
  id: number;
  number: number;
  name: string;
  episodeOrder: number | null;
  premiereDate: string | null;
  endDate: string | null;
  image: { medium: string; original: string } | null;
}

// --- Search ---
export async function searchTVMaze(query: string): Promise<TVMazeSearchResult[]> {
  try {
    const res = await fetch(
      `${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`,
      {
        next: { revalidate: TVMAZE_SEARCH_REVALIDATE },
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Show Details ---
export async function getShowDetails(id: number): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(`${TVMAZE_BASE}/shows/${id}`, {
      next: { revalidate: TVMAZE_REVALIDATE },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getShowDetailsWithEmbedded(
  id: number
): Promise<TVMazeShow | null> {
  try {
    const res = await fetch(
      `${TVMAZE_BASE}/shows/${id}?embed[]=episodes&embed[]=cast`,
      {
        next: { revalidate: TVMAZE_REVALIDATE },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// --- Show Seasons ---
export async function getShowSeasons(showId: number): Promise<TVMazeRawSeason[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE}/shows/${showId}/seasons`, {
      next: { revalidate: TVMAZE_REVALIDATE },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Season Episodes ---
export async function getSeasonEpisodes(seasonId: number): Promise<TVMazeRawEpisode[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE}/seasons/${seasonId}/episodes`, {
      next: { revalidate: TVMAZE_REVALIDATE },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Shows Index (paginated, sorted by weight/popularity) ---
export async function getShowsPage(page: number = 0): Promise<TVMazeShow[]> {
  try {
    const res = await fetch(`${TVMAZE_BASE}/shows?page=${page}`, {
      next: { revalidate: TVMAZE_REVALIDATE },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Schedule (what's on today) ---
export async function getSchedule(country: string = "US", date?: string): Promise<TVMazeRawEpisode[]> {
  try {
    let url = `${TVMAZE_BASE}/schedule?country=${country}`;
    if (date) url += `&date=${date}`;
    const res = await fetch(url, {
      next: { revalidate: TVMAZE_SEARCH_REVALIDATE },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Normalize TVMaze data to our unified format ---
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export function normalizeTVMazeShow(show: TVMazeShow): NormalizedContent {
  const cast =
    show._embedded?.cast?.map((entry, index): CastMember => ({
      id: `tv-cast-${show.id}-${index}`,
      name: entry.person.name,
      role: entry.character?.name || undefined,
      photo: entry.person.image?.medium || null,
    })) || [];
  const castMembers = cast.map((entry) => entry.name);

  return {
    id: `tv-${show.id}`,
    imdbId: show.externals?.imdb || "",
    title: show.name,
    year: show.premiered?.split("-")[0] || "",
    poster: show.image?.original || show.image?.medium || null,
    backdrop: show.image?.original || null,
    overview: stripHtml(show.summary),
    rating: show.rating?.average || 0,
    voteCount: 0,
    genres: show.genres || [],
    mediaType: "tv",
    duration: show.averageRuntime ? `${show.averageRuntime}m per ep` : "",
    actors: castMembers.join(", "),
    cast,
    castMembers,
    popularity: show.weight || 0,
  };
}

export function normalizeTVMazeSeason(season: TVMazeRawSeason): TVMazeSeason {
  return {
    id: season.id,
    number: season.number,
    name: season.name || `Season ${season.number}`,
    episodeOrder: season.episodeOrder || 0,
  };
}

export function normalizeTVMazeEpisode(ep: TVMazeRawEpisode): TVMazeEpisode {
  return {
    id: ep.id,
    name: ep.name,
    season: ep.season,
    number: ep.number,
    airdate: ep.airdate || "",
    runtime: ep.runtime || 0,
    image: ep.image,
    summary: stripHtml(ep.summary),
  };
}
