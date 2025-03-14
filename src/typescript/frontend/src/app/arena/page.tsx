import { fetchArenaInfo } from "@/queries/arena";
import { ArenaClient } from "components/pages/arena/ArenaClient";
import { redirect } from "next/navigation";
import { ROUTES } from "router/routes";
import { fetchSpecificMarkets } from "@sdk/indexer-v2";

export const revalidate = 2;

const logAndReturnValue = <T extends [] | undefined | null | Record<string, unknown>>(
  dataType: string,
  onFailure: T
) => {
  console.warn(`[WARNING]: Failed to fetch ${dataType}.`);
  return onFailure;
};

export default async function Arena() {
  let arenaInfo: Awaited<ReturnType<typeof fetchArenaInfo>> = null;

  try {
    arenaInfo = await fetchArenaInfo({});
  } catch (e) {
    console.warn("Could not get melee data.");
    redirect(ROUTES.home);
  }

  if (!arenaInfo) {
    redirect(ROUTES.home);
  }

  const { market0, market1 } = await fetchSpecificMarkets([
    arenaInfo.emojicoin0Symbols,
    arenaInfo.emojicoin1Symbols,
  ])
    .then((res) => ({
      market0: res.find((v) => v.market.marketAddress === arenaInfo.emojicoin0MarketAddress),
      market1: res.find((v) => v.market.marketAddress === arenaInfo.emojicoin1MarketAddress),
    }))
    .catch(() =>
      logAndReturnValue("arena market0 and market1", { market0: undefined, market1: undefined })
    );

  if (!market0 || !market1) {
    console.warn("Couldn't fetch market state for one of the arena markets.");
    redirect(ROUTES.home);
  }

  return (
    <ArenaClient
      arenaInfo={arenaInfo}
      market0={market0!}
      market1={market1!}
      candlesticksMarket0={[]}
      candlesticksMarket1={[]}
    />
  );
}
