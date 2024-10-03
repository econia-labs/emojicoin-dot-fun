import { fetchPriceFeed } from "@/queries/home";
import { PriceFeedInner } from "./inner";

export const PriceFeed = async () => {
  const data = await fetchPriceFeed({});

  return <PriceFeedInner data={data} />
};
