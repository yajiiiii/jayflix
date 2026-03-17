import { NextResponse } from "next/server";
import { getTVSeasonEpisodes } from "@/services/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;

  try {
    const episodes = await getTVSeasonEpisodes(
      parseInt(id),
      parseInt(seasonNumber)
    );
    return NextResponse.json({ episodes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch season" },
      { status: 500 }
    );
  }
}
