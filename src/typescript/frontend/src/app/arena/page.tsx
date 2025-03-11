import { fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
// import { emoji } from "utils";
// import type { SymbolEmoji } from "@sdk/emoji_data";
import type { PeriodicStateEventModel } from "@sdk/indexer-v2/types";
import { redirect } from "next/navigation";
import { parseJSON } from "utils";
import { Period } from "@sdk/const";
import { getCandlesticksRoute } from "app/api/candlesticks/utils";
import { type AnyNumberString } from "@sdk-types";

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
    redirect("/home");
  }

  if (!arenaInfo) {
    redirect("/home");
  }

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin0MarketAddress,
    }),
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin1MarketAddress,
    }),
  ]);

  const getCandlesticks = (marketID: AnyNumberString) =>
    getCandlesticksRoute({
      marketID: Number(marketID),
      to: Math.ceil(new Date().getTime() / 1000),
      countBack: 500,
      period: Period.Period1M,
    }).then((res) => parseJSON<PeriodicStateEventModel[]>(res));

  const [candlesticksMarket0, candlesticksMarket1] = await Promise.all([
    getCandlesticks(market0!.market.marketID),
    getCandlesticks(market1!.market.marketID),
  ]);

  return (
    <ArenaClient
      arenaInfo={arenaInfo}
      market0={market0!}
      market1={market1!}
      candlesticksMarket0={candlesticksMarket0}
      candlesticksMarket1={candlesticksMarket1}
    />
  );
}
