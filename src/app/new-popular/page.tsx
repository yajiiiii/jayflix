import {
  getNetflixPHTrendingTodayMovies,
  getNetflixPHTrendingTodayTV,
  getNetflixPHTrendingMovies,
  getNetflixPHTrendingTV,
  getTopRatedMovies,
  getFilipinoMovies,
} from "@/services/content";
import CatalogGridSection from "@/components/CatalogGridSection";
import { mergeUniqueContent } from "@/utils/content";

export const revalidate = 900;

export default async function NewPopularPage() {
  const [todayMovies, todayTV, phMovies, phShows, topRated, filipino] = await Promise.all([
    getNetflixPHTrendingTodayMovies(),
    getNetflixPHTrendingTodayTV(),
    getNetflixPHTrendingMovies(),
    getNetflixPHTrendingTV(),
    getTopRatedMovies(),
    getFilipinoMovies(),
  ]);

  const allPicks = mergeUniqueContent(
    todayMovies,
    todayTV,
    phMovies,
    phShows,
    filipino,
    topRated
  );

  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-[1720px] space-y-10 px-4 md:px-8 xl:px-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
            CAN&apos;T FIND? JUST SEARCH IT!
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            New & Popular
          </h1>
        </header>

        <CatalogGridSection
          id="all-fresh"
          title="All New & Popular Picks"
          items={allPicks}
        />
      </div>
    </div>
  );
}
