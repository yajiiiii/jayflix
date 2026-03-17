const FLIXPATROL_PH_URL = "https://flixpatrol.com/top10/netflix/philippines/";
const TUDUM_PH_MOVIES_URL = "https://www.netflix.com/tudum/top10/philippines";
const TUDUM_PH_TV_URL = "https://www.netflix.com/tudum/top10/philippines/tv";

const TREND_TODAY_REVALIDATE = 60 * 15;
const TREND_WEEK_REVALIDATE = 60 * 60;

interface TrendTitleSet {
  movies: string[];
  tv: string[];
}

const HTML_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    );
}

function cleanTrendTitle(title: string): string {
  return decodeHtml(title)
    .replace(/:\s+(season|part|book|chapter|volume)\s+\d+\b.*$/i, "")
    .replace(/\s+\b(season|part|book|chapter|volume)\s+\d+\b.*$/i, "")
    .replace(/\s+\((limited series|mini series|miniseries)\)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const title of titles) {
    const cleaned = cleanTrendTitle(title);
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

async function fetchHtml(url: string, revalidate: number): Promise<string> {
  try {
    const response = await fetch(url, {
      next: { revalidate },
      headers: HTML_HEADERS,
    });

    if (!response.ok) {
      return "";
    }

    return response.text();
  } catch {
    return "";
  }
}

function extractFlixPatrolTableTitles(html: string, heading: string): string[] {
  if (!html) {
    return [];
  }

  const sectionPattern = new RegExp(
    `<h3[^>]*>\\s*${escapeRegex(
      heading
    )}\\s*<\\/h3>[\\s\\S]*?<tbody[^>]*>([\\s\\S]*?)<\\/tbody>`,
    "i"
  );
  const section = html.match(sectionPattern)?.[1] || "";

  if (!section) {
    return [];
  }

  const titles = [...section.matchAll(/<a href="\/title\/[^"]+"[^>]*>([^<]+)<\/a>/g)].map(
    (match) => match[1]
  );

  return uniqueTitles(titles).slice(0, 10);
}

function extractTudumTitles(html: string): string[] {
  if (!html) {
    return [];
  }

  const titles = [...html.matchAll(/data-uia="top10-card"[\s\S]*?<img[^>]+alt="([^"]+)"/g)].map(
    (match) => match[1]
  );

  return uniqueTitles(titles).slice(0, 10);
}

export async function getNetflixPhilippinesTrendingTodayTitles(): Promise<TrendTitleSet> {
  const html = await fetchHtml(FLIXPATROL_PH_URL, TREND_TODAY_REVALIDATE);

  return {
    movies: extractFlixPatrolTableTitles(html, "TOP 10 Movies"),
    tv: extractFlixPatrolTableTitles(html, "TOP 10 TV Shows"),
  };
}

export async function getNetflixPhilippinesTrendingWeekTitles(): Promise<TrendTitleSet> {
  const [moviesHtml, tvHtml] = await Promise.all([
    fetchHtml(TUDUM_PH_MOVIES_URL, TREND_WEEK_REVALIDATE),
    fetchHtml(TUDUM_PH_TV_URL, TREND_WEEK_REVALIDATE),
  ]);

  return {
    movies: extractTudumTitles(moviesHtml),
    tv: extractTudumTitles(tvHtml),
  };
}
