import CatalogPosterCard from "@/components/CatalogPosterCard";
import type { NormalizedContent } from "@/services/content";

interface CatalogGridSectionProps {
  id?: string;
  title: string;
  description?: string;
  items: NormalizedContent[];
  limit?: number;
}

export default function CatalogGridSection({
  id,
  title,
  description,
  items,
  limit,
}: CatalogGridSectionProps) {
  const visibleItems = limit ? items.slice(0, limit) : items;

  if (!visibleItems.length) {
    return null;
  }

  return (
    <section
      id={id}
      className="scroll-mt-28 space-y-6"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-white md:text-[2.25rem]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-4xl text-sm leading-6 text-white/62 md:text-[0.98rem]">
              {description}
            </p>
          ) : null}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/36">
          {visibleItems.length} titles
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {visibleItems.map((item, index) => (
          <CatalogPosterCard
            key={item.id}
            item={item}
            priority={Boolean(index < 2)}
          />
        ))}
      </div>
    </section>
  );
}
