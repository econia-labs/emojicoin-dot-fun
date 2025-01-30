import { ARENA_MODULE_ADDRESS } from "@sdk/const";
import type { ArenaInfoModel, MarketStateModel, DatabaseModels } from "@sdk/indexer-v2/types";
import { ArenaCard } from "components/pages/home/components/arena-card";
import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card/MainCard";
import { PriceFeed } from "components/price-feed";
import TextCarousel from "components/text-carousel/TextCarousel";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";

export interface HomePageProps {
  markets: Array<DatabaseModels["market_state"]>;
  numMarkets: number;
  page: number;
  sortBy: MarketDataSortByHomePage;
  searchBytes?: string;
  children?: React.ReactNode;
  priceFeed: DatabaseModels["price_feed"][];
  meleeData: {
    melee: ArenaInfoModel;
    market0: MarketStateModel;
    market1: MarketStateModel;
  } | null;
}

export default async function HomePageComponent({
  markets,
  numMarkets,
  page,
  sortBy,
  searchBytes,
  children,
  priceFeed,
  meleeData,
}: HomePageProps) {
  return (
    <div className="relative">
      <div className="flex-col mb-[31px]">
        {priceFeed.length > 0 ? <PriceFeed data={priceFeed} /> : <TextCarousel />}
        <div className="flex justify-center items-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full max-h-[60dvh]">
          {ARENA_MODULE_ADDRESS && meleeData ? (
            <ArenaCard
              market0Symbol={meleeData.market0.market.symbolEmojis.join("")}
              market1Symbol={meleeData.market1.market.symbolEmojis.join("")}
              rewardsRemaining={meleeData.melee.rewardsRemaining}
              meleeVolume={meleeData.melee.volume}
              aptLocked={meleeData.melee.aptLocked}
              startTime={meleeData.melee.startTime / 1000n / 1000n}
              duration={meleeData.melee.duration / 1000n / 1000n}
            />
          ) : (
            <MainCard featuredMarkets={priceFeed} page={page} sortBy={sortBy} />
          )}
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
    </div>
  );
}
