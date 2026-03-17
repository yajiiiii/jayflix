import {
  getNetflixPHTrendingTodayMovies,
  getNetflixPHTrendingTodayTV,
  getNetflixPHTrendingMovies,
  getNetflixPHTrendingTV,
  getTopRatedMovies,
  getFilipinoMovies,
  getPopularTV,
  getTopRatedTV,
} from "@/services/content";
import HeroBanner from "@/components/HeroBanner";
import ContentRow from "@/components/ContentRow";
import { interleaveContentRows, pickHeroItems } from "@/utils/content";

export const revalidate = 900;

export default async function HomePage() {
  const [
    todayMovies,
    todayTV,
    phTrendingMovies,
    phTrendingTV,
    topRated,
    filipino,
    popularTV,
    topRatedTV,
  ] = await Promise.all([
    getNetflixPHTrendingTodayMovies(),
    getNetflixPHTrendingTodayTV(),
    getNetflixPHTrendingMovies(),
    getNetflixPHTrendingTV(),
    getTopRatedMovies(),
    getFilipinoMovies(),
    getPopularTV(),
    getTopRatedTV(),
  ]);

  const todayTrending = interleaveContentRows(todayMovies, todayTV);
  const weekTrending = interleaveContentRows(phTrendingMovies, phTrendingTV);

  const heroItems = pickHeroItems(
    todayMovies,
    todayTV,
    phTrendingMovies,
    phTrendingTV,
    filipino,
    topRated,
    popularTV,
    topRatedTV
  );

  return (
    <div className="pb-24">
      <HeroBanner items={heroItems} />

      <div className="relative z-10 -mt-20 space-y-7 pb-6 pt-8 md:-mt-24 md:space-y-9 md:pt-12">
        <ContentRow
          title="Top Movies This Week on Netflix Philippines"
          items={phTrendingMovies}
          isTopTen
        />
        <ContentRow
          title="Top Shows This Week on Netflix Philippines"
          items={phTrendingTV}
          isTopTen
        />
        <ContentRow title="Trending Today in the Philippines" items={todayTrending} />
        <ContentRow title="Trending This Week in the Philippines" items={weekTrending} />
        <ContentRow title="Filipino Favorites" items={filipino} />
        <ContentRow title="Award-Winning Movies" items={topRated} />
        <ContentRow title="Popular TV Shows" items={popularTV} />
        <ContentRow title="Top Rated TV" items={topRatedTV} />
      </div>
    </div>
  );
}
