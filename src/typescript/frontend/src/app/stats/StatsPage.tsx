import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { StatsCarousel } from "./MarketPreview";

export interface HomePageProps {
  numMarkets: Promise<number>;
  priceFeedData: Promise<DatabaseModels["price_feed"][]>;
  marketCapData: Promise<DatabaseModels["market_state"][]>;
  allTimeVolumeData: Promise<DatabaseModels["market_state"][]>;
  latestPricesData: Promise<DatabaseModels["market_state"][]>;
  tvlData: Promise<DatabaseModels["market_state"][]>;
}

export default function StatsPageComponent(props: HomePageProps) {
  return (
    <>
      <div className="flex flex-col mb-[31px] text-white">
        <div className="flex flex-row m-auto">
          <span>{"num markets:"}</span>
          <div>
            <LoadingSkeleton
              promised={props.numMarkets.then((res) => (
                <div>{res}</div>
              ))}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <StatsCarousel
            elements={[
              props.numMarkets.then((numMarkets) => <div>{numMarkets}</div>),
              props.priceFeedData.then((priceFeedData) => (
                <div className="flex flex-row m-auto text-white">
                  {priceFeedData.map((v) => (
                    <div key={`priceFeedData-${v.market.symbolData.symbol}`} className="text-white text-lg">
                      {v.market.symbolData.symbol}
                    </div>
                  ))}
                </div>
              )),
              props.marketCapData.then((marketCapData) => (
                <div className="flex flex-row m-auto text-white">
                  {marketCapData.map((v) => (
                    <div key={`marketCapData-${v.market.symbolData.symbol}`} className="text-white text-lg">
                      {v.market.symbolData.symbol}
                    </div>
                  ))}
                </div>
              )),
              props.allTimeVolumeData.then((allTimeVolumeData) => (
                <div className="flex flex-row m-auto text-white">
                  {allTimeVolumeData.map((v) => (
                    <div key={`allTimeVolumeData-${v.market.symbolData.symbol}`} className="text-white text-lg">
                      {v.market.symbolData.symbol}
                    </div>
                  ))}
                </div>
              )),
              props.latestPricesData.then((latestPricesData) => (
                <div className="flex flex-row m-auto text-white">
                  {latestPricesData.map((v) => (
                    <div key={`latestPricesData-${v.market.symbolData.symbol}`} className="text-white text-lg">
                      {v.market.symbolData.symbol}
                    </div>
                  ))}
                </div>
              )),
              props.tvlData.then((tvlData) => (
                <div className="flex flex-row m-auto text-white">
                  {tvlData.map((v) => (
                    <div key={`tvlData-${v.market.symbolData.symbol}`} className="text-white text-lg">
                      {v.market.symbolData.symbol}
                    </div>
                  ))}
                </div>
              )),
            ]}
          />
        </div>
      </div>
    </>
  );
}
