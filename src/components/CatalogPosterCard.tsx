import Image from "next/image";
import Link from "next/link";
import type { NormalizedContent } from "@/services/content";

interface CatalogPosterCardProps {
  item: NormalizedContent;
  priority?: boolean;
}

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

export default function CatalogPosterCard({
  item,
  priority = false,
}: CatalogPosterCardProps) {
  const imageSrc = item.poster || item.backdrop;
  const summary =
    item.overview.length > 90 ? `${item.overview.slice(0, 90)}...` : item.overview;

  return (
    <Link href={getWatchUrl(item)} className="group block" prefetch>
      <article className="overflow-hidden rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,#1d1d1d_0%,#121212_100%)] shadow-[0_18px_38px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-white/18 hover:shadow-[0_26px_46px_rgba(0,0,0,0.42)]">
        <div className="relative aspect-[2/3] overflow-hidden bg-[#1d1d1d]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={item.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 19vw, (min-width: 768px) 28vw, 44vw"
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/65">
              {item.title}
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.16)_45%,rgba(0,0,0,0.9)_100%)]" />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="rounded-full bg-[#e50914] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              {item.mediaType === "tv" ? "Series" : "Movie"}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
            <h3 className="line-clamp-2 text-base font-semibold text-white">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/72">
              {item.year ? <span>{item.year}</span> : null}
              {item.rating > 0 ? <span>{item.rating.toFixed(1)}</span> : null}
              {item.duration ? <span>{item.duration}</span> : null}
            </div>
            {summary ? (
              <p className="line-clamp-2 text-xs leading-5 text-white/62">
                {summary}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
