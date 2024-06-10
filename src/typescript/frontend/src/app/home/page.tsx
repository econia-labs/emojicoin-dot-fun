import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card";
import TextCarousel from "components/text-carousel/TextCarousel";
import cached from "lib/queries/cached";
import fetchSortedMarketData, { fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { type HomePageSearchParams } from "lib/queries/sorting/query-params";
import { MarketDataSortBy, toPostgrestQueryParam } from "lib/queries/sorting/types";
import { REVALIDATION_TIME } from "lib/server-env";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "auto";

const fetchMarketData = cached(async (page: string) => fetchMarketData(page));
interface HomePageParams {
  params?: {};
  searchParams?: HomePageSearchParams;
  children: React.ReactNode;
}

export default async function Home({ searchParams, children }: HomePageParams) {
  const {
    page: pageInput,
    sort = MarketDataSortBy.MarketCap,
    order: orderBy = "desc",
    bonding: inBondingCurve = null,
  } = searchParams ?? {};

  const sortBy = toPostgrestQueryParam(sort);

  let page: number;
  try {
    page = parseInt(pageInput ?? "1");
  } catch (e) {
    page = 1;
  }

  const featured = await fetchFeaturedMarket({
    sortBy,
    orderBy,
    inBondingCurve,
  });

  const { markets, count } = await fetchSortedMarketData({
    page,
    sortBy,
    orderBy,
    inBondingCurve,
  });

  return (
    <div className="pt-[93px]">
      <div className="flex-col mb-[31px]">
        <TextCarousel />
        <div className="flex justify-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full">
          <MainCard featured={featured} />
        </div>
        {children}
        <TextCarousel />
      </div>

      {/* Should we pop featured off or just leave it in the grid? Much simpler to do the former. */}
      <EmojiTable data={markets} totalNumberOfMarkets={count} />
    </div>
  );
}
