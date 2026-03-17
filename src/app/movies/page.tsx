import {
  getNetflixPHTrendingTodayMovies,
  getNetflixPHTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getActionMovies,
  getComedyMovies,
  getHorrorMovies,
  getSciFiMovies,
  getTop10Movies,
  getFilipinoMovies,
} from "@/services/content";
import CatalogGridSection from "@/components/CatalogGridSection";
import { mergeUniqueContent } from "@/utils/content";

export const revalidate = 900;

export default async function MoviesPage() {
  const [
    todayTrending,
    phTrending,
    popular,
    topRated,
    top10,
    filipino,
    action,
    comedy,
    horror,
    scifi,
  ] = await Promise.all([
      getNetflixPHTrendingTodayMovies(),
      getNetflixPHTrendingMovies(),
      getPopularMovies(),
      getTopRatedMovies(),
      getTop10Movies(),
      getFilipinoMovies(),
      getActionMovies(),
      getComedyMovies(),
      getHorrorMovies(),
      getSciFiMovies(),
    ]);
  const allMovies = mergeUniqueContent(
    todayTrending,
    phTrending,
    filipino,
    popular,
    topRated,
    top10,
    action,
    comedy,
    horror,
    scifi
  );

  return (
    <div className="pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-[1720px] space-y-10 px-4 md:px-8 xl:px-12">
        <header className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
            CAN&apos;T FIND? JUST SEARCH IT!
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Movies
          </h1>
        </header>

        <CatalogGridSection
          id="all-movies"
          title="All Movie Picks"
          items={allMovies}
        />
      </div>
    </div>
  );
}
