import {
  searchMoviesFMDB,
  getMovieDetailsFMDB,
  normalizeFMDBSearch,
  normalizeFMDBDetails,
  type NormalizedContent,
} from "./fmdb";
import {
  searchTVMaze,
  getShowDetails,
  getShowDetailsWithEmbedded,
  getShowSeasons,
  getSeasonEpisodes,
  normalizeTVMazeShow,
  normalizeTVMazeSeason,
  normalizeTVMazeEpisode,
  type TVMazeShow,
} from "./tvmaze";
import {
  getNetflixPhilippinesTrendingTodayTitles,
  getNetflixPhilippinesTrendingWeekTitles,
} from "./live-trends";
import {
  TRENDING_MOVIES,
  TOP_10_MOVIES,
  POPULAR_MOVIES,
  TOP_RATED_MOVIES,
  ACTION_MOVIES,
  COMEDY_MOVIES,
  HORROR_MOVIES,
  SCIFI_MOVIES,
  FILIPINO_MOVIES,
  NETFLIX_PH_TRENDING_TODAY_MOVIES,
  NETFLIX_PH_TRENDING_TODAY_TV_IDS,
  NETFLIX_PH_TRENDING_MOVIES,
  NETFLIX_PH_TRENDING_TV_IDS,
  TRENDING_TV_IDS,
  TOP_RATED_TV_IDS,
  POPULAR_TV_IDS,
  CRIME_TV_IDS,
  DRAMA_TV_IDS,
  SCIFI_TV_IDS,
} from "./curated";
import type { TVMazeSeason, TVMazeEpisode } from "./fmdb";

const cache = new Map<string, { data: NormalizedContent; ts: number }>();
const resolutionCache = new Map<
  string,
  { data: NormalizedContent | null; ts: number }
>();
const CACHE_TTL = 30 * 60 * 1000;
const RESOLUTION_CACHE_TTL = 6 * 60 * 60 * 1000;
const MOVIE_ROW_LIMIT = 12;
const TV_ROW_LIMIT = 12;
const TRENDING_MOVIE_LIMIT = 6;
const TRENDING_TV_LIMIT = 6;
const LIVE_TREND_LIMIT = 10;

function getMovieTitleResolutionOverride(title: string): string | null {
  switch (normalizeMatchText(title)) {
    case "firebreak":
      return "tt33474179";
    case "re member the last night":
      return "tt21250176";
    default:
      return null;
  }
}

function getCached(key: string): NormalizedContent | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return entry.data;
  }

  return null;
}

function setCache(key: string, data: NormalizedContent) {
  cache.set(key, { data, ts: Date.now() });
}

function getResolutionCache(key: string): NormalizedContent | null | undefined {
  const entry = resolutionCache.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() - entry.ts >= RESOLUTION_CACHE_TTL) {
    resolutionCache.delete(key);
    return undefined;
  }

  return entry.data;
}

function setResolutionCache(key: string, data: NormalizedContent | null) {
  resolutionCache.set(key, { data, ts: Date.now() });
}

function normalizeMatchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreTitleMatch(candidate: string, target: string): number {
  const candidateText = normalizeMatchText(candidate);
  const targetText = normalizeMatchText(target);

  if (!candidateText || !targetText) {
    return 0;
  }

  if (candidateText === targetText) {
    return 100;
  }

  if (
    candidateText.startsWith(targetText) ||
    targetText.startsWith(candidateText)
  ) {
    return 92;
  }

  const candidateTokens = candidateText.split(" ");
  const targetTokens = targetText.split(" ");
  const overlap = targetTokens.filter((token) =>
    candidateTokens.includes(token)
  ).length;

  return Math.round((overlap / Math.max(candidateTokens.length, targetTokens.length)) * 80);
}

function buildSearchVariants(title: string): string[] {
  const variants = new Set<string>();
  const cleaned = title.replace(/\s+/g, " ").trim();

  if (cleaned) {
    variants.add(cleaned);
  }

  const withoutParens = cleaned.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (withoutParens) {
    variants.add(withoutParens);
  }

  const splitPatterns = [":", " - ", " – ", " — "];
  for (const pattern of splitPatterns) {
    if (!cleaned.includes(pattern)) {
      continue;
    }

    const base = cleaned.split(pattern)[0]?.trim();
    if (base) {
      variants.add(base);
    }
  }

  return [...variants];
}

function mergeRankedContent(
  primary: NormalizedContent[],
  fallback: NormalizedContent[],
  limit: number = LIVE_TREND_LIMIT
): NormalizedContent[] {
  const merged: NormalizedContent[] = [];
  const seen = new Set<string>();

  for (const item of [...primary, ...fallback]) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    merged.push(item);

    if (merged.length === limit) {
      break;
    }
  }

  return merged;
}

async function fetchMovieByImdbId(
  imdbId: string
): Promise<NormalizedContent | null> {
  const cached = getCached(`movie:${imdbId}`);
  if (cached) {
    return cached;
  }

  const data = await getMovieDetailsFMDB(imdbId);
  if (!data) {
    return null;
  }

  const normalized = normalizeFMDBDetails(data, imdbId);
  setCache(`movie:${imdbId}`, normalized);
  return normalized;
}

async function fetchTVByMazeId(
  mazeId: number
): Promise<NormalizedContent | null> {
  const cached = getCached(`tv:${mazeId}`);
  if (cached) {
    return cached;
  }

  const show = await getShowDetails(mazeId);
  if (!show) {
    return null;
  }

  const normalized = normalizeTVMazeShow(show);
  setCache(`tv:${mazeId}`, normalized);
  return normalized;
}

async function resolveMovieTitle(title: string): Promise<NormalizedContent | null> {
  const cacheKey = `resolve:movie:${normalizeMatchText(title)}`;
  const cached = getResolutionCache(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const overrideId = getMovieTitleResolutionOverride(title);
  if (overrideId) {
    const override = await fetchMovieByImdbId(overrideId);
    setResolutionCache(cacheKey, override);
    return override;
  }

  for (const query of buildSearchVariants(title)) {
    const results = await searchMoviesFMDB(query);
    const bestMatch = results
      .map((result) => ({
        result,
        score: Math.max(
          scoreTitleMatch(result.name, title),
          scoreTitleMatch(result.name, query)
        ),
      }))
      .sort((left, right) => right.score - left.score)[0];

    if (!bestMatch || bestMatch.score < 55) {
      continue;
    }

    const resolved = await fetchMovieByImdbId(
      bestMatch.result.imdb_id || bestMatch.result.id
    );

    if (resolved) {
      setResolutionCache(cacheKey, resolved);
      return resolved;
    }
  }

  setResolutionCache(cacheKey, null);
  return null;
}

async function resolveTVTitle(title: string): Promise<NormalizedContent | null> {
  const cacheKey = `resolve:tv:${normalizeMatchText(title)}`;
  const cached = getResolutionCache(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  for (const query of buildSearchVariants(title)) {
    const results = await searchTVMaze(query);
    const bestMatch = results
      .map((result) => ({
        result,
        score:
          Math.max(
            scoreTitleMatch(result.show.name, title),
            scoreTitleMatch(result.show.name, query)
          ) + Math.round(result.score * 10),
      }))
      .sort((left, right) => right.score - left.score)[0];

    if (!bestMatch || bestMatch.score < 60) {
      continue;
    }

    const resolved = await fetchTVByMazeId(bestMatch.result.show.id);

    if (resolved) {
      setResolutionCache(cacheKey, resolved);
      return resolved;
    }
  }

  setResolutionCache(cacheKey, null);
  return null;
}

async function fetchMoviesBatch(imdbIds: string[]): Promise<NormalizedContent[]> {
  const results = await Promise.allSettled(
    imdbIds.map((id) => fetchMovieByImdbId(id))
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<NormalizedContent | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as NormalizedContent);
}

async function fetchTVBatch(mazeIds: number[]): Promise<NormalizedContent[]> {
  const results = await Promise.allSettled(
    mazeIds.map((id) => fetchTVByMazeId(id))
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<NormalizedContent | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as NormalizedContent);
}

async function resolveMovieTitles(titles: string[]): Promise<NormalizedContent[]> {
  const results = await Promise.allSettled(
    titles.slice(0, LIVE_TREND_LIMIT).map(async (title) => {
      const overrideId = getMovieTitleResolutionOverride(title);

      if (overrideId) {
        return fetchMovieByImdbId(overrideId);
      }

      return resolveMovieTitle(title);
    })
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<NormalizedContent | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as NormalizedContent);
}

async function resolveTVTitles(titles: string[]): Promise<NormalizedContent[]> {
  const results = await Promise.allSettled(
    titles.slice(0, LIVE_TREND_LIMIT).map((title) => resolveTVTitle(title))
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<NormalizedContent | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as NormalizedContent);
}

function interleaveContent(
  first: NormalizedContent[],
  second: NormalizedContent[]
): NormalizedContent[] {
  const combined: NormalizedContent[] = [];
  const maxLength = Math.max(first.length, second.length);

  for (let index = 0; index < maxLength; index += 1) {
    if (index < first.length) {
      combined.push(first[index]);
    }

    if (index < second.length) {
      combined.push(second[index]);
    }
  }

  return combined;
}

export async function searchAll(query: string): Promise<NormalizedContent[]> {
  const [movies, tvResults] = await Promise.all([
    searchMoviesFMDB(query),
    searchTVMaze(query),
  ]);

  const normalizedMovies = movies.slice(0, 10).map(normalizeFMDBSearch);
  const normalizedTV = tvResults
    .slice(0, 10)
    .map((result) => normalizeTVMazeShow(result.show));

  return interleaveContent(normalizedMovies, normalizedTV);
}

export async function searchMovies(query: string): Promise<NormalizedContent[]> {
  const results = await searchMoviesFMDB(query);
  return results.slice(0, 15).map(normalizeFMDBSearch);
}

export async function searchTV(query: string): Promise<NormalizedContent[]> {
  const results = await searchTVMaze(query);
  return results
    .slice(0, 15)
    .map((result) => normalizeTVMazeShow(result.show));
}

export async function getTrending(): Promise<NormalizedContent[]> {
  const [movies, tv] = await Promise.all([
    fetchMoviesBatch(TRENDING_MOVIES.slice(0, TRENDING_MOVIE_LIMIT)),
    fetchTVBatch(TRENDING_TV_IDS.slice(0, TRENDING_TV_LIMIT)),
  ]);

  return interleaveContent(movies, tv);
}

export async function getTop10Movies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(TOP_10_MOVIES);
}

export async function getPopularMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(POPULAR_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getTopRatedMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(TOP_RATED_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getActionMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(ACTION_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getComedyMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(COMEDY_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getHorrorMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(HORROR_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getSciFiMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(SCIFI_MOVIES.slice(0, MOVIE_ROW_LIMIT));
}

export async function getFilipinoMovies(): Promise<NormalizedContent[]> {
  return fetchMoviesBatch(FILIPINO_MOVIES);
}

export async function getNetflixPHTrendingTodayMovies(): Promise<NormalizedContent[]> {
  const liveTitles = await getNetflixPhilippinesTrendingTodayTitles();
  const resolved = await resolveMovieTitles(liveTitles.movies);

  if (resolved.length >= LIVE_TREND_LIMIT) {
    return resolved.slice(0, LIVE_TREND_LIMIT);
  }

  const fallback = await fetchMoviesBatch(NETFLIX_PH_TRENDING_TODAY_MOVIES);
  return mergeRankedContent(resolved, fallback);
}

export async function getNetflixPHTrendingTodayTV(): Promise<NormalizedContent[]> {
  const liveTitles = await getNetflixPhilippinesTrendingTodayTitles();
  const resolved = await resolveTVTitles(liveTitles.tv);

  if (resolved.length >= LIVE_TREND_LIMIT) {
    return resolved.slice(0, LIVE_TREND_LIMIT);
  }

  const fallback = await fetchTVBatch(NETFLIX_PH_TRENDING_TODAY_TV_IDS);
  return mergeRankedContent(resolved, fallback);
}

export async function getNetflixPHTrendingToday(): Promise<NormalizedContent[]> {
  const [movies, tv] = await Promise.all([
    getNetflixPHTrendingTodayMovies(),
    getNetflixPHTrendingTodayTV(),
  ]);

  return interleaveContent(movies, tv);
}

export async function getNetflixPHTrendingMovies(): Promise<NormalizedContent[]> {
  const liveTitles = await getNetflixPhilippinesTrendingWeekTitles();
  const resolved = await resolveMovieTitles(liveTitles.movies);

  if (resolved.length >= LIVE_TREND_LIMIT) {
    return resolved.slice(0, LIVE_TREND_LIMIT);
  }

  const fallback = await fetchMoviesBatch(NETFLIX_PH_TRENDING_MOVIES);
  return mergeRankedContent(resolved, fallback);
}

export async function getNetflixPHTrendingTV(): Promise<NormalizedContent[]> {
  const liveTitles = await getNetflixPhilippinesTrendingWeekTitles();
  const resolved = await resolveTVTitles(liveTitles.tv);

  if (resolved.length >= LIVE_TREND_LIMIT) {
    return resolved.slice(0, LIVE_TREND_LIMIT);
  }

  const fallback = await fetchTVBatch(NETFLIX_PH_TRENDING_TV_IDS);
  return mergeRankedContent(resolved, fallback);
}

export async function getNetflixPHTrending(): Promise<NormalizedContent[]> {
  const [movies, tv] = await Promise.all([
    getNetflixPHTrendingMovies(),
    getNetflixPHTrendingTV(),
  ]);

  return interleaveContent(movies, tv);
}

export async function getTrendingTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(TRENDING_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getPopularTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(POPULAR_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getTopRatedTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(TOP_RATED_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getCrimeTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(CRIME_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getDramaTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(DRAMA_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getSciFiTV(): Promise<NormalizedContent[]> {
  return fetchTVBatch(SCIFI_TV_IDS.slice(0, TV_ROW_LIMIT));
}

export async function getContentDetails(
  id: string,
  type: "movie" | "tv"
): Promise<NormalizedContent | null> {
  if (type === "tv") {
    const mazeId = Number.parseInt(id.replace("tv-", ""), 10);
    if (Number.isNaN(mazeId)) {
      return null;
    }

    const show = await getShowDetailsWithEmbedded(mazeId);
    if (!show) {
      return null;
    }

    const normalized = normalizeTVMazeShow(show);
    const rawSeasons = await getShowSeasons(mazeId);

    normalized.seasons = rawSeasons
      .filter((season) => season.number > 0)
      .map(normalizeTVMazeSeason);

    if (show._embedded?.episodes) {
      normalized.episodes = show._embedded.episodes.map(normalizeTVMazeEpisode);
    }

    return normalized;
  }

  return fetchMovieByImdbId(id);
}

export async function getTVSeasonEpisodes(
  showId: number,
  seasonNumber: number
): Promise<TVMazeEpisode[]> {
  const seasons = await getShowSeasons(showId);
  const season = seasons.find((entry) => entry.number === seasonNumber);

  if (!season) {
    return [];
  }

  const episodes = await getSeasonEpisodes(season.id);
  return episodes.map(normalizeTVMazeEpisode);
}

export async function getTVShowRaw(mazeId: number): Promise<TVMazeShow | null> {
  return getShowDetailsWithEmbedded(mazeId);
}

export type { NormalizedContent, TVMazeSeason, TVMazeEpisode };
