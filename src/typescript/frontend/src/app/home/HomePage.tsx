import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card/MainCard";
import TextCarousel from "components/text-carousel/TextCarousel";
import { type fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import type fetchSortedMarketData from "lib/queries/sorting/market-data";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";

export interface HomePageProps {
  featured: Awaited<ReturnType<typeof fetchFeaturedMarket>>;
  markets: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"];
  count: number;
  page: number;
  sortBy: MarketDataSortByHomePage;
  searchBytes?: string;
  children?: React.ReactNode;
  geoblocked: boolean;
}

export default async function HomePageComponent({
  featured,
  markets,
  count,
  page,
  sortBy,
  searchBytes,
  children,
  geoblocked
}: HomePageProps) {
  return (
    <>
      <div className="pt-[93px]">
        <div className="flex-col mb-[31px]">
          <TextCarousel />
          <div className="flex justify-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full max-h-[60dvh]">
            <MainCard featured={featured} page={page} sortBy={sortBy} searchBytes={searchBytes} />
          </div>
          {children}
          <TextCarousel />
        </div>

        <EmojiTable
          data={markets}
          totalNumberOfMarkets={count}
          page={page}
          sortBy={sortBy}
          searchBytes={searchBytes}
          geoblocked={geoblocked}
        />
      </div>
    </>
  );
}
