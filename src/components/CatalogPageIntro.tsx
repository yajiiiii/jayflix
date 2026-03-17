import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import type { NormalizedContent } from "@/services/content";

interface JumpLink {
  href: string;
  label: string;
}

interface Metric {
  label: string;
  value: string;
}

interface CatalogPageIntroProps {
  accent: string;
  description: string;
  eyebrow: string;
  feature: NormalizedContent | undefined;
  metrics: Metric[];
  supporting: NormalizedContent[];
  title: string;
  jumps: JumpLink[];
}

function getWatchUrl(item: NormalizedContent): string {
  return item.mediaType === "tv"
    ? `/watch/tv/${item.id.replace("tv-", "")}`
    : `/watch/movie/${item.imdbId || item.id}`;
}

export default function CatalogPageIntro({
  accent,
  description,
  eyebrow,
  feature,
  metrics,
  supporting,
  title,
  jumps,
}: CatalogPageIntroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-28 md:px-12 md:pb-12">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top left, ${accent}, transparent 34%), linear-gradient(180deg, #111111 0%, #141414 72%, #141414 100%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,#141414_100%)]" />

      <div className="relative mx-auto max-w-[1440px] space-y-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/46">
                {eyebrow}
              </p>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-white md:text-6xl xl:text-[5.25rem]">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {jumps.map((jump) => (
                <a
                  key={jump.href}
                  href={jump.href}
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/86 transition hover:bg-white/12"
                >
                  {jump.label}
                </a>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            {feature ? (
              <Link
                href={getWatchUrl(feature)}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1a1a1a] shadow-[0_28px_60px_rgba(0,0,0,0.32)]"
              >
                <div className="relative min-h-[360px]">
                  {feature.backdrop || feature.poster ? (
                    <Image
                      src={feature.backdrop || feature.poster || ""}
                      alt={feature.title}
                      fill
                      priority
                      sizes="(min-width: 1280px) 40vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      unoptimized
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(11,11,11,0.9)_0%,rgba(11,11,11,0.5)_38%,rgba(11,11,11,0.72)_100%)]" />

                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                      Featured Pick
                    </p>
                    <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
                      {feature.title}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/75">
                      {feature.rating > 0 ? (
                        <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1">
                          {feature.rating.toFixed(1)}
                        </span>
                      ) : null}
                      {feature.year ? (
                        <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1">
                          {feature.year}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/12 bg-black/22 px-3 py-1">
                        {feature.mediaType === "tv" ? "Series" : "Movie"}
                      </span>
                    </div>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                      {feature.overview
                        ? feature.overview.slice(0, 190) +
                          (feature.overview.length > 190 ? "..." : "")
                        : "Open the title to start watching."}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
                        <FiPlay className="fill-current" size={14} />
                        Watch
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white">
                        Open Title
                        <FiArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {supporting.map((item) => (
                <Link
                  key={item.id}
                  href={getWatchUrl(item)}
                  className="group flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-3 transition hover:border-white/16 hover:bg-white/[0.07]"
                >
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-[0.95rem] bg-[#232323]">
                    {item.poster || item.backdrop ? (
                      <Image
                        src={item.poster || item.backdrop || ""}
                        alt={item.title}
                        fill
                        sizes="56px"
                        className="object-cover transition duration-300 group-hover:scale-[1.04]"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/48">
                      {item.mediaType === "tv" ? "Series" : "Movie"}
                      {item.year ? ` • ${item.year}` : ""}
                    </p>
                    {item.rating > 0 ? (
                      <p className="text-xs text-white/72">
                        {item.rating.toFixed(1)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
