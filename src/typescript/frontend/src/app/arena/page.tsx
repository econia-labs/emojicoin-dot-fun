import { fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
// import { emoji } from "utils";
// import type { SymbolEmoji } from "@sdk/emoji_data";
import type { PeriodicStateEventModel } from "@sdk/indexer-v2/types";
import { redirect } from "next/navigation";
import { parseJSON } from "utils";
import { getCandlesticksRoute } from "../candlesticks/utils";
import { Period } from "@sdk/const";
import { ROUTES } from "router/routes";
import { symbolToEmojis } from "@sdk/emoji_data";

export const revalidate = 2;

export default async function Arena() {
  let arenaInfo: Awaited<ReturnType<typeof fetchArenaInfo>> = null;

  try {
    arenaInfo = await fetchArenaInfo({});
  } catch (e) {
    console.warn(
      "Could not get melee data. This probably means that the backend is running an outdated version of the processor" +
        " without the arena processing. Please update."
    );
    redirect(ROUTES.home);
  }

  if (!arenaInfo) {
    redirect(ROUTES.home);
  }

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin0MarketAddress,
    }),
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin1MarketAddress,
    }),
  ]);

  if (!market0 || !market1) {
    console.warn("Couldn't fetch market state for one of the arena markets.");
    redirect(ROUTES.home);
  }

  const to = Math.ceil(new Date().getTime() / 1000);
  const countBack = 500;
  const period = Period.Period1M;

  const [candlesticksMarket0, candlesticksMarket1] = await Promise.all([
    getCandlesticksRoute(Number(market0!.market.marketID), to, period, countBack).then((res) =>
      parseJSON<PeriodicStateEventModel[]>(res)
    ),
    getCandlesticksRoute(Number(market1!.market.marketID), to, period, countBack).then((res) =>
      parseJSON<PeriodicStateEventModel[]>(res)
    ),
  ]);

  const [symbol0, symbol1] = [market0.market.symbolData.symbol, market1.market.symbolData.symbol];
  const allSymbolEmojiData = [...symbolToEmojis(symbol0).emojis, ...symbolToEmojis(symbol1).emojis];

  return (
    <ArenaClient
      allSymbolEmojiData={allSymbolEmojiData}
      arenaInfo={arenaInfo}
      market0={market0}
      market1={market1}
      symbol0={symbol0}
      symbol1={symbol1}
      candlesticksMarket0={candlesticksMarket0}
      candlesticksMarket1={candlesticksMarket1}
    />
  );
}
