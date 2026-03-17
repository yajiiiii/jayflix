// Movie data service.
// Uses Cinemeta for dependable movie metadata and imdbot for lightweight search.

const IMDBOT_BASE = "https://search.imdbot.workers.dev";
const CINEMETA_BASE = "https://v3-cinemeta.strem.io";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w300";
const SEARCH_REVALIDATE = 60 * 60;
const DETAILS_REVALIDATE = 60 * 60 * 6;

export interface FMDBSearchResult {
  id: string;
  imdb_id: string;
  type: "movie";
  name: string;
  poster: string | null;
  background: string | null;
  releaseInfo?: string;
}

interface CinemetaSearchResponse {
  metas?: FMDBSearchResult[];
}

interface ImdbSearchResult {
  "#TITLE": string;
  "#YEAR": number;
  "#IMDB_ID": string;
  "#IMG_POSTER"?: string;
}

interface ImdbSearchResponse {
  ok?: boolean;
  description?: ImdbSearchResult[];
}

interface CinemetaMovieMeta {
  id: string;
  imdb_id: string;
  moviedb_id?: number;
  type: "movie";
  name: string;
  description?: string;
  poster?: string | null;
  background?: string | null;
  imdbRating?: string;
  runtime?: string;
  director?: string[];
  cast?: string[];
  genre?: string[];
  genres?: string[];
  popularity?: number;
  popularities?: {
    moviedb?: number;
    stremio?: number;
    trakt?: number;
  };
  country?: string;
  year?: string;
  releaseInfo?: string;
  credits_cast?: CinemetaCastCredit[];
}

interface CinemetaCastCredit {
  character?: string;
  id: number;
  name: string;
  profile_path?: string | null;
}

interface CinemetaMovieResponse {
  meta?: CinemetaMovieMeta;
}

interface ImdbAggregateRating {
  ratingValue?: number;
  ratingCount?: number;
}

interface ImdbMovieShort {
  name?: string;
  image?: string;
  description?: string;
  contentRating?: string;
  genre?: string[];
  datePublished?: string;
  aggregateRating?: ImdbAggregateRating;
}

interface ImdbMarkdownValue {
  plainText?: string;
}

interface ImdbDisplayableValue {
  value?: ImdbMarkdownValue;
}

interface ImdbCharacterEdge {
  node?: {
    name?: string;
  };
}

interface ImdbRoleEdge {
  node?: {
    characters?: {
      edges?: ImdbCharacterEdge[];
    };
  };
}

interface ImdbCastCredit {
  name?: {
    id?: string;
    nameText?: {
      text?: string;
    };
    primaryImage?: {
      url?: string;
    } | null;
  };
  creditedRoles?: {
    edges?: ImdbRoleEdge[];
  } | null;
}

interface ImdbCastGroup {
  credits?: ImdbCastCredit[];
}

interface ImdbImageEdge {
  node?: {
    url?: string;
    width?: number;
    height?: number;
  };
}

interface ImdbMovieMain {
  castV2?: ImdbCastGroup[];
  titleMainImages?: {
    edges?: ImdbImageEdge[];
  };
  primaryImage?: {
    url?: string;
  } | null;
  plot?: {
    plotText?: ImdbMarkdownValue;
  };
  certificate?: {
    rating?: string;
  } | null;
  runtime?: {
    displayableProperty?: ImdbDisplayableValue;
  } | null;
}

interface ImdbMovieResponse {
  short?: ImdbMovieShort;
  main?: ImdbMovieMain;
}

export interface FMDBTitleResponse {
  meta: CinemetaMovieMeta;
  short?: ImdbMovieShort;
  main?: ImdbMovieMain;
}

function uniqueCastMembers(cast: CastMember[]): CastMember[] {
  const seen = new Set<string>();
  const unique: CastMember[] = [];

  for (const member of cast) {
    const key = member.id || member.name.toLowerCase();

    if (!member.name || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(member);
  }

  return unique;
}

function extractImdbCast(main?: ImdbMovieMain): CastMember[] {
  if (!main?.castV2?.length) {
    return [];
  }

  const cast = main.castV2.flatMap((group, groupIndex) =>
    (group.credits || []).map((credit, creditIndex): CastMember | null => {
      const name = credit.name?.nameText?.text?.trim();

      if (!name) {
        return null;
      }

      const roles = (credit.creditedRoles?.edges || [])
        .flatMap((edge) =>
          (edge.node?.characters?.edges || [])
            .map((character) => character.node?.name?.trim())
            .filter(Boolean) as string[]
        )
        .filter(Boolean);

      return {
        id: credit.name?.id || `movie-cast-imdb-${groupIndex}-${creditIndex}`,
        name,
        role: roles.length > 0 ? Array.from(new Set(roles)).slice(0, 2).join(", ") : undefined,
        photo: credit.name?.primaryImage?.url || null,
      };
    })
  );

  return uniqueCastMembers(cast.filter(Boolean) as CastMember[]);
}

function extractBackdrop(main?: ImdbMovieMain): string | null {
  const candidates = (main?.titleMainImages?.edges || [])
    .map((edge) => edge.node)
    .filter(
      (image): image is NonNullable<typeof image> =>
        Boolean(image?.url && image.width && image.height && image.width > image.height)
    )
    .sort((left, right) => (right.width || 0) * (right.height || 0) - (left.width || 0) * (left.height || 0));

  return candidates[0]?.url || null;
}

async function fetchJson<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function searchMoviesFMDB(query: string): Promise<FMDBSearchResult[]> {
  const imdbData = await fetchJson<ImdbSearchResponse>(
    `${IMDBOT_BASE}/?q=${encodeURIComponent(query)}`,
    SEARCH_REVALIDATE
  );

  if (imdbData?.ok && imdbData.description?.length) {
    return imdbData.description.map((item) => ({
      id: item["#IMDB_ID"],
      imdb_id: item["#IMDB_ID"],
      type: "movie",
      name: item["#TITLE"],
      poster: item["#IMG_POSTER"] || null,
      background: item["#IMG_POSTER"] || null,
      releaseInfo: item["#YEAR"] ? String(item["#YEAR"]) : "",
    }));
  }

  const cinemetaUrl = `${CINEMETA_BASE}/catalog/movie/top/search=${encodeURIComponent(
    query
  )}.json`;
  const cinemetaData = await fetchJson<CinemetaSearchResponse>(
    cinemetaUrl,
    SEARCH_REVALIDATE
  );
  return (cinemetaData?.metas || []).filter((item) => item.type === "movie");
}

export async function getMovieDetailsFMDB(
  imdbId: string
): Promise<FMDBTitleResponse | null> {
  const [cinemeta, imdb] = await Promise.all([
    fetchJson<CinemetaMovieResponse>(
      `${CINEMETA_BASE}/meta/movie/${imdbId}.json`,
      DETAILS_REVALIDATE
    ),
    fetchJson<ImdbMovieResponse>(
      `${IMDBOT_BASE}/?tt=${encodeURIComponent(imdbId)}`,
      DETAILS_REVALIDATE
    ),
  ]);

  if (!cinemeta?.meta) {
    return null;
  }

  return {
    meta: cinemeta.meta,
    short: imdb?.short,
    main: imdb?.main,
  };
}

export function normalizeFMDBSearch(item: FMDBSearchResult): NormalizedContent {
  return {
    id: item.imdb_id || item.id,
    imdbId: item.imdb_id || item.id,
    title: item.name,
    year: item.releaseInfo || "",
    poster: item.poster || null,
    backdrop: item.background || item.poster || null,
    overview: "",
    rating: 0,
    voteCount: 0,
    genres: [],
    mediaType: "movie",
    popularity: 0,
  };
}

export function normalizeFMDBDetails(
  data: FMDBTitleResponse,
  imdbId: string
): NormalizedContent {
  const meta = data.meta;
  const short = data.short;
  const imdbCast = extractImdbCast(data.main);
  const cinemetaCast = meta.credits_cast?.map((member) => ({
      id: `movie-cast-${member.id}`,
      name: member.name,
      role: member.character || undefined,
      photo: member.profile_path
        ? `${TMDB_IMAGE_BASE}${member.profile_path}`
        : null,
    })) || [];
  const namedCast = (meta.cast || []).map((name, index) => ({
      id: `movie-cast-name-${index}`,
      name,
      photo: null,
    }));
  const cast = uniqueCastMembers(
    imdbCast.length > 0 ? imdbCast : cinemetaCast.length > 0 ? cinemetaCast : namedCast
  );
  const castMembers = cast.map((member) => member.name);
  const rating = Number.parseFloat(
    meta.imdbRating || String(short?.aggregateRating?.ratingValue || 0)
  );
  const imdbBackdrop = extractBackdrop(data.main);
  const runtime = meta.runtime || data.main?.runtime?.displayableProperty?.value?.plainText || "";

  return {
    id: imdbId,
    imdbId,
    title: meta.name || short?.name || "Untitled",
    year:
      meta.year ||
      meta.releaseInfo ||
      short?.datePublished?.slice(0, 4) ||
      "",
    poster: short?.image || data.main?.primaryImage?.url || meta.poster || null,
    backdrop:
      meta.background || imdbBackdrop || meta.poster || short?.image || data.main?.primaryImage?.url || null,
    overview:
      meta.description || short?.description || data.main?.plot?.plotText?.plainText || "",
    rating: Number.isFinite(rating) ? rating : 0,
    voteCount: short?.aggregateRating?.ratingCount || 0,
    genres: meta.genres || meta.genre || short?.genre || [],
    mediaType: "movie",
    duration: runtime,
    director: meta.director?.join(", ") || "",
    actors: castMembers.join(", "),
    cast,
    castMembers,
    contentRating: short?.contentRating || data.main?.certificate?.rating || "",
    popularity: meta.popularities?.moviedb || meta.popularity || 0,
    country: meta.country || "",
    tmdbId: meta.moviedb_id,
  };
}

// Unified content type used across the app.
export interface NormalizedContent {
  id: string;
  imdbId: string;
  title: string;
  year: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  rating: number;
  voteCount: number;
  genres: string[];
  mediaType: "movie" | "tv";
  duration?: string;
  director?: string;
  actors?: string;
  cast?: CastMember[];
  castMembers?: string[];
  contentRating?: string;
  popularity?: number;
  country?: string;
  tmdbId?: number;
  seasons?: TVMazeSeason[];
  episodes?: TVMazeEpisode[];
}

export interface CastMember {
  id: string;
  name: string;
  role?: string;
  photo?: string | null;
}

// Re-export TVMaze types for convenience.
export interface TVMazeSeason {
  id: number;
  number: number;
  name: string;
  episodeOrder: number;
}

export interface TVMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  runtime: number;
  image: { medium: string; original: string } | null;
  summary: string;
}
