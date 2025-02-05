import { fetchArenaInfo, fetchMarketStateByAddress } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
// import { emoji } from "utils";
// import type { SymbolEmoji } from "@sdk/emoji_data";
import type { PeriodicStateEventModel } from "@sdk/indexer-v2/types";
import { redirect } from "next/navigation";
import { parseJSON } from "utils";
import { getCandlesticksRoute } from "../candlesticks/utils";
import { Period } from "@sdk/const";

export const revalidate = 2;


export default async function Arena() {
  let arenaInfo: Awaited<ReturnType<typeof fetchArenaInfo>> = null;

  /* Uncomment to use fake data
  arenaInfo = {
    duration: 120n * 1000n * 1000n,
    startTime: BigInt(new Date().getTime() * 1000 - 1000 * 1000 * 60),
    volume: 123n * 10n ** 8n,
    meleeId: 2n,
    aptLocked: 12n * 10n ** 8n,
    maxMatchAmount: 5n * 10n ** 8n,
    rewardsRemaining: 12345n * 10n ** 6n,
    maxMatchPercentage: 50n,
    emojicoin0MarketAddress: "0x9efc3e9aa9b5921fdffc8e7ac21452319902130603083351fc7c961d8ab97d6a",
    emojicoin1MarketAddress: "0x3a26d1a4b37877e56bd7cbc8af5e8c0a26d876025bc02e67ca7b96c8bdd2fc26",
    emojicoin0Symbols: [emoji("butterfly") as SymbolEmoji],
    emojicoin1Symbols: [emoji("ribbon") as SymbolEmoji],
    emojicoin0MarketId: 1n,
    emojicoin1MarketId: 2n,
  };

  const [market0, market1] = await Promise.all([
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin0MarketAddress,
    }),
    fetchMarketStateByAddress({
      address: arenaInfo.emojicoin1MarketAddress,
    }),
  ]);
  /* */

  /* Uncomment to use real data */
  try {
    arenaInfo = await fetchArenaInfo({});
  } catch (e) {
    console.warn(
      "Could not get melee data. This probably means that the backend is running an outdated version of the processor, without the arena processing. Please update."
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
  /* */

  return (
    <ArenaClient
      arenaInfo={arenaInfo}
      market0={market0!}
      market1={market1!}
      //candlesticksMarket0={[]}
      //candlesticksMarket1={[]}
      candlesticksMarket0={candlesticksMarket0}
      candlesticksMarket1={candlesticksMarket1}
    />
  );
}
