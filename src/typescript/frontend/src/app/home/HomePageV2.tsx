import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { StyledImage } from "components/image/styled";
import CoinsList from "componentsV2/Home/CoinsList";
import HeroSection from "componentsV2/Home/HeroSection";
import TabBar from "componentsV2/Home/TabBar";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";
import React from "react";

export interface HomePageProps {
  markets: Array<DatabaseModels["market_state"]>;
  numMarkets: number;
  page: number;
  sortBy: MarketDataSortByHomePage;
  searchBytes?: string;
  children?: React.ReactNode;
  priceFeed: DatabaseModels["price_feed"][];
}

const HomePageComponentV2: React.FC<HomePageProps> = async (): Promise<JSX.Element> => {
  return (
    <div id="home" className="relative overflow-hidden pt-[120px] md:pt-[130px] lg:pt-[130px]">
      <div className="container">
        <div className="mx-0 md:-mx-4 flex items-center justify-between flex-wrap mt-16">
          <HeroSection />
          <TabBar />
          <CoinsList />
        </div>
      </div>
      <StyledImage
        style={{ height: "60%", marginBottom: "-40px", zIndex: -1 }}
        className="w-full absolute bottom z-40"
        src="/images/home/coin-list-gradient.png"
      />
    </div>
  );
};

export default HomePageComponentV2;
