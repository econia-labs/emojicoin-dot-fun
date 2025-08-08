import FEATURE_FLAGS from "lib/feature-flags";
import { fetchCachedArenaInfo } from "lib/queries/arena-info";
import { unstable_cache } from "next/cache";
import { parseResponseJSON, stringifyJSON } from "utils";

import type { ArenaInfoModel } from "@/sdk/indexer-v2";
import { fetchSpecificMarkets, fetchVaultBalance, toArenaInfoModel } from "@/sdk/indexer-v2";

import calculateExchangeRateDelta from "./calculate-exchange-rate-delta";
import fetchCachedExchangeRatesAtMeleeStart from "./fetch-melee-start-open-price";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return {
    arenaInfo: null,
    market0: null,
    market1: null,
    rewardsRemaining: null,
    market0Delta: null,
    market1Delta: null,
  } as const;
};

export type MeleeData = Awaited<ReturnType<typeof fetchMeleeData>>;
const fetchMeleeData = async ({
  arenaInfo,
  exchangeRatesPromise,
}: {
  arenaInfo: ArenaInfoModel;
  exchangeRatesPromise: ReturnType<typeof invokeExchangeRatesCallback>;
}) => {
  try {
    const vaultBalancePromise = fetchVaultBalance();

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

    const [vaultBalance, meleeStartExchangeRates] = await Promise.all([
      vaultBalancePromise,
      exchangeRatesPromise,
    ]);

    const { market0ExchangeRate: mkt0Rate, market1ExchangeRate: mkt1Rate } =
      meleeStartExchangeRates;

    return {
      arenaInfo,
      market0,
      market1,
      rewardsRemaining: vaultBalance ? vaultBalance.arenaVaultBalanceUpdate.newBalance : 0n,
      market0Delta: mkt0Rate ? calculateExchangeRateDelta(mkt0Rate, market0) : null,
      market1Delta: mkt1Rate ? calculateExchangeRateDelta(mkt1Rate, market1) : null,
    };
  } catch (e) {
    return logAndDefault(e);
  }
};

const invokeExchangeRatesCallback = (arenaInfo: ArenaInfoModel) =>
  fetchCachedExchangeRatesAtMeleeStart(arenaInfo)().catch((e) => {
    console.error(
      `Couldn't fetch exchange rates at melee start for melee ID: ${arenaInfo.meleeID}`
    );
    console.error(e);
    return {
      market0ExchangeRate: null,
      market1ExchangeRate: null,
    };
  });

const cachedFetches = async () => {
  const arenaInfo = await fetchCachedArenaInfo()
    .then((res) => (res ? toArenaInfoModel(res) : res))
    .catch((e) => {
      console.error(e);
      return null;
    });

  if (!arenaInfo) return logAndDefault("Couldn't fetch arena info.");

  const exchangeRatesPromise = invokeExchangeRatesCallback(arenaInfo);
  const fetchCachedCurrentMeleeData = unstable_cache(
    async () =>
      fetchMeleeData({ arenaInfo, exchangeRatesPromise }).catch(logAndDefault).then(stringifyJSON),
    ["current-melee-data"],
    {
      revalidate: 2,
      tags: ["current-melee-data"],
    }
  );
  return fetchCachedCurrentMeleeData().then(parseResponseJSON<MeleeData>);
};

export const fetchCachedMeleeData = async () => {
  if (!FEATURE_FLAGS.Arena) throw new Error("Do not call this function when arena isn't enabled.");

  const res = await cachedFetches().catch((e) => logAndDefault(e));

  if (!res.arenaInfo) console.warn(`[WARNING]: Failed to fetch melee data.`);

  return res;
};
