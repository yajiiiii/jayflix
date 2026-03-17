import { NextResponse } from "next/server";
import {
  getPopularMovies,
  getTopRatedMovies,
  getActionMovies,
  getComedyMovies,
  getHorrorMovies,
  getSciFiMovies,
} from "@/services/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "popular";

  try {
    let results;
    switch (category) {
      case "top_rated":
        results = await getTopRatedMovies();
        break;
      case "action":
        results = await getActionMovies();
        break;
      case "comedy":
        results = await getComedyMovies();
        break;
      case "horror":
        results = await getHorrorMovies();
        break;
      case "scifi":
        results = await getSciFiMovies();
        break;
      default:
        results = await getPopularMovies();
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
