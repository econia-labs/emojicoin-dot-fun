import { type DatabaseModels } from "@sdk/indexer-v2/types";
import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card/MainCard";
import { PriceFeed } from "components/price-feed";
import TextCarousel from "components/text-carousel/TextCarousel";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";

export interface HomePageProps {
  featured?: DatabaseModels["market_latest_state_event"];
  markets: Array<DatabaseModels["market_state"]>;
  numMarkets: number;
  page: number;
  sortBy: MarketDataSortByHomePage;
  searchBytes?: string;
  children?: React.ReactNode;
  priceFeed: Array<DatabaseModels["price_feed"]>;
}

export default async function HomePageComponent({
  featured,
  markets,
  numMarkets,
  page,
  sortBy,
  searchBytes,
  children,
  priceFeed,
}: HomePageProps) {
  return (
    <>
      <div className="flex-col mb-[31px]">
        {priceFeed.length > 0 ? <PriceFeed data={priceFeed} /> : <TextCarousel />}
        <div className="flex justify-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full max-h-[60dvh]">
          <MainCard featured={featured} page={page} sortBy={sortBy} />
        </div>
        {children}
        <TextCarousel />
      </div>

      <EmojiTable
        markets={markets}
        numMarkets={numMarkets}
        page={page}
        sortBy={sortBy}
        searchBytes={searchBytes}
      />
    </>
  );
}
