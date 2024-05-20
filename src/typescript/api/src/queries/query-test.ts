import dotenv from "dotenv";

import { CandlestickResolution, MODULE_ADDRESS } from "../emojicoin_dot_fun";
import { getAllCandlesticks } from "./candlesticks";
import getMarketData, { getAllMarketEvents } from "./markets";

dotenv.config({
  path: "../../.env",
});

console.log(MODULE_ADDRESS);
export { default as getMarketData } from "./markets";

const main = async () => {
  const markets = await getAllMarketEvents({});
  const markets2 = await getMarketData({});
  const latestMarket = markets[0].data.marketMetadata.marketID;
  console.log(`latest market: ${  latestMarket}`);
  console.log(`num markets: ${  markets.length}`);
  console.log(`num markets2: ${  Object.keys(markets2).length}`);
  // markets.forEach((m) => {
  //   console.log(m);
  // });
  Object.keys(markets2).forEach((k) => {
    console.log(k);
  });
  const res = await getAllCandlesticks({
    marketID: Number(latestMarket),
    resolution: CandlestickResolution.PERIOD_1S,
  });

  res.forEach((r) => {
    console.log(r);
  });

  console.log(res.length);
};

main();
