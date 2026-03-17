import { NextResponse } from "next/server";
import { searchAll, searchMovies, searchTV } from "@/services/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "multi";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    let results;
    switch (type) {
      case "movie":
        results = await searchMovies(query);
        break;
      case "tv":
        results = await searchTV(query);
        break;
      default:
        results = await searchAll(query);
    }
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search" },
      { status: 500 }
    );
  }
}
