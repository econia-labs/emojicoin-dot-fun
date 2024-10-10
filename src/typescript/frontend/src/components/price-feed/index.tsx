import type { DatabaseModels } from "@sdk/indexer-v2/types";
import { PriceFeedInner } from "./inner";

export const PriceFeed = async ({ data }: { data: Array<DatabaseModels["price_feed"]> }) => {
  return <PriceFeedInner data={data} />;
};
