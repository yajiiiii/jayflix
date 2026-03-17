import { NextResponse } from "next/server";
import {
  getNetflixPHTrending,
  getNetflixPHTrendingMovies,
  getNetflixPHTrendingTV,
  getNetflixPHTrendingToday,
  getNetflixPHTrendingTodayMovies,
  getNetflixPHTrendingTodayTV,
} from "@/services/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const window = searchParams.get("window") || "week";
  const type = searchParams.get("type") || "all";

  try {
    let results;

    if (window === "today") {
      switch (type) {
        case "movie":
          results = await getNetflixPHTrendingTodayMovies();
          break;
        case "tv":
          results = await getNetflixPHTrendingTodayTV();
          break;
        default:
          results = await getNetflixPHTrendingToday();
      }
    } else {
      switch (type) {
        case "movie":
          results = await getNetflixPHTrendingMovies();
          break;
        case "tv":
          results = await getNetflixPHTrendingTV();
          break;
        default:
          results = await getNetflixPHTrending();
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trending" },
      { status: 500 }
    );
  }
}
