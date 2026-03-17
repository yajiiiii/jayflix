export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getTitle(item: { title?: string; name?: string }): string {
  return item.title || item.name || "Untitled";
}

export function getYear(item: { release_date?: string; first_air_date?: string }): string {
  const date = item.release_date || item.first_air_date;
  return date ? date.split("-")[0] : "";
}

export function getMediaType(item: { media_type?: string; title?: string }): "movie" | "tv" {
  if (item.media_type === "tv") return "tv";
  if (item.media_type === "movie") return "movie";
  return item.title ? "movie" : "tv";
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
