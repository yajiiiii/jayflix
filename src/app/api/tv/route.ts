import { NextResponse } from "next/server";
import {
  getPopularTV,
  getTopRatedTV,
  getTrendingTV,
  getCrimeTV,
  getDramaTV,
  getSciFiTV,
} from "@/services/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "popular";

  try {
    let results;
    switch (category) {
      case "top_rated":
        results = await getTopRatedTV();
        break;
      case "trending":
        results = await getTrendingTV();
        break;
      case "crime":
        results = await getCrimeTV();
        break;
      case "drama":
        results = await getDramaTV();
        break;
      case "scifi":
        results = await getSciFiTV();
        break;
      default:
        results = await getPopularTV();
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch TV shows" },
      { status: 500 }
    );
  }
}
