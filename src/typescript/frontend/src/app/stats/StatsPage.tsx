import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { MarketPreviewCarousel } from "./MarketPreview";

export interface HomePageProps {
  numMarkets: Promise<number>;
  priceFeed: Promise<DatabaseModels["price_feed"][]>;
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
        <div className="flex flex-row w-fit">
          <LoadingSkeleton
            promised={props.priceFeed.then((res) => (
              <MarketPreviewCarousel markets={res} />
            ))}
          />
        </div>
      </div>
    </>
  );
}
