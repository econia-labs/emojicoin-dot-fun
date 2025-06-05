import { ArenaCard } from "components/pages/home/components/arena-card";
import EmojiTable from "components/pages/home/components/emoji-table";
import MainCard from "components/pages/home/components/main-card/MainCard";
import { PriceFeed } from "components/price-feed";
import TextCarousel from "components/text-carousel/TextCarousel";
import FEATURE_FLAGS from "lib/feature-flags";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";

import type { ArenaProps } from "@/components/pages/arena/utils";
import { SubscribeToHomePageEvents } from "@/components/pages/home/components/SubscribeToHomePageEvents";
import type { DatabaseModels } from "@/sdk/indexer-v2/types";

export interface HomePageProps {
  markets: Array<DatabaseModels["market_state"]>;
  numMarkets: number;
  page: number;
  sortBy: MarketDataSortByHomePage;
  searchBytes?: string;
  children?: React.ReactNode;
  priceFeed: DatabaseModels["price_feed"][];
  meleeData: ArenaProps | null;
  isFavoriteFilterEnabled: boolean;
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
  isFavoriteFilterEnabled,
}: HomePageProps) {
  return (
    <div className="relative">
      <div className="flex-col mb-[31px]">
        {priceFeed.length > 0 ? <PriceFeed data={priceFeed} /> : <TextCarousel />}
        <div className="flex justify-center items-center px-[16px] mobile-lg:px-[24px] mx-auto w-full max-w-full">
          {FEATURE_FLAGS.Arena && meleeData ? (
            <ArenaCard meleeData={meleeData} />
          ) : (
            <MainCard featuredMarkets={priceFeed} page={page} sortBy={sortBy} />
          )}
        </div>
        {children}
        <TextCarousel />
      </div>

      <EmojiTable
        isFavoriteFilterEnabled={isFavoriteFilterEnabled}
        markets={markets}
        numMarkets={numMarkets}
        page={page}
        sortBy={sortBy}
        searchBytes={searchBytes}
      />
      <SubscribeToHomePageEvents info={meleeData?.arenaInfo} />
    </div>
  );
}
