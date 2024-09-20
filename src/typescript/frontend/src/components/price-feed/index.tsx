import { PriceFeedInner } from "./inner";
import type { PriceFeedData } from "./types";

const getPriceFeedData = async (): Promise<PriceFeedData> => ([{
  emoji: "💲",
  change: 2.45,
}, {
  emoji: "🚀",
  change: -3.69,
}, {
  emoji: "🔥",
  change: 12.124,
}, {
  emoji: "💩",
  change: 1.02,
}, {
  emoji: "😉🎉",
  change: -21.89,
}, {
  emoji: "🦅",
  change: 7.42,
}, {
  emoji: "🎂",
  change: -9.32,
}, {
  emoji: "🐕🐕",
  change: 23.1,
}])

export const PriceFeed = async () => {
  const data = await getPriceFeedData();

  return <PriceFeedInner data={data} />
};
