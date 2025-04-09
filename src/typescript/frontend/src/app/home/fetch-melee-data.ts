import FEATURE_FLAGS from "lib/feature-flags";
import { fetchCachedArenaInfo } from "lib/queries/arena-info";
import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

import { fetchSpecificMarkets, toArenaInfoModel } from "@/sdk/indexer-v2";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return {
    arenaInfo: null,
    market0: null,
    market1: null,
  } as const;
};

type MeleeData = Awaited<ReturnType<typeof fetchMeleeData>>;
const fetchMeleeData = async () => {
  try {
    const arenaInfo = await fetchCachedArenaInfo()
      .then((res) => (res ? toArenaInfoModel(res) : null))
      .catch(() => null);

    if (!arenaInfo) {
      throw new Error("Couldn't fetch arena info");
    }

    const { market0, market1 } = await fetchSpecificMarkets([
      arenaInfo.emojicoin0Symbols,
      arenaInfo.emojicoin1Symbols,
    ]).then((res) => ({
      market0: res.find((v) => v.market.marketAddress === arenaInfo.emojicoin0MarketAddress),
      market1: res.find((v) => v.market.marketAddress === arenaInfo.emojicoin1MarketAddress),
    }));

    if (!market0 || !market1) {
      throw new Error("Couldn't fetch arena markets.");
    }
    return { arenaInfo, market0, market1 };
  } catch (e) {
    return logAndDefault(e);
  }
};

const cachedFetch = unstable_cache(
  async () => {
    const res = await fetchMeleeData().catch((e) => logAndDefault(e));
    return stringifyJSON(res);
  },
  [],
  {
    revalidate: 2,
    tags: ["current-melee"],
  }
);

export const fetchCachedMeleeData = async () => {
  if (!FEATURE_FLAGS.Arena) throw new Error("Do not call this function when arena isn't enabled.");

  const res = await cachedFetch()
    .then(parseJSON<MeleeData>)
    .catch((e) => logAndDefault(e));

  if (!res.arenaInfo) console.warn(`[WARNING]: Failed to fetch melee data.`);

  return res;
};
