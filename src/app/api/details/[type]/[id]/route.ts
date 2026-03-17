import { NextResponse } from "next/server";
import { getContentDetails } from "@/services/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  try {
    const details = await getContentDetails(id, type as "movie" | "tv");
    if (!details) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch details" },
      { status: 500 }
    );
  }
}
