import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { ClientTable } from "./ClientTable";

export interface StatsPageProps {
  numMarkets: number;
  priceFeedData: DatabaseModels["price_feed"][];
  dailyVolumeData: DatabaseModels["market_state"][];
  marketCapData: DatabaseModels["market_state"][];
  allTimeVolumeData: DatabaseModels["market_state"][];
  latestPricesData: DatabaseModels["market_state"][];
  tvlData: DatabaseModels["market_state"][];
}

export default function StatsPageComponent(props: StatsPageProps) {
  return (
    <>
      <div className="flex flex-col mb-[31px] opacity-[.95] w-full">
        <div className="flex flex-row m-auto">
          <span>{"num markets:"}</span>
          <div>{props.numMarkets}</div>
          <span>{"global stats"}</span>
          <div>{"global stats go here or something"}</div>
        </div>
        <ClientTable
          price={props.latestPricesData}
          allTimeVolume={props.allTimeVolumeData}
          priceDelta={props.priceFeedData}
          dailyVolume={props.dailyVolumeData}
          lastAvgExecutionPrice={props.latestPricesData}
          tvl={props.tvlData}
          marketCap={props.marketCapData}
        />
      </div>
    </>
  );
}
