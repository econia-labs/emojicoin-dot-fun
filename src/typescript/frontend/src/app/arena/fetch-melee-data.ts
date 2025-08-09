import FEATURE_FLAGS from "lib/feature-flags";
import { fetchCachedArenaInfo } from "lib/queries/arena-info";
import { unstable_cache } from "next/cache";

import { toMarketStateModel } from "@/sdk/index";
import type { DatabaseJsonType } from "@/sdk/indexer-v2";
import {
  fetchSpecificMarketsJson,
  fetchVaultBalanceJson,
  toArenaInfoModel,
} from "@/sdk/indexer-v2";

import calculateExchangeRateDelta from "./calculate-exchange-rate-delta";
import createCachedExchangeRatesAtMeleeStartFetcher from "./fetch-melee-start-open-price";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return {
    arenaInfo: null,
    market0: null,
    market1: null,
    rewardsRemaining: null,
    market0Delta: null,
    market1Delta: null,
  };
};

const fetchMeleeData = async ({
  arena_info,
  exchange_rates_promise,
}: {
  arena_info: DatabaseJsonType["arena_info"];
  exchange_rates_promise: ReturnType<typeof fetchCachedExchangeRatesWithErrorHandling>;
}) => {
  const vault_balance_promise = fetchVaultBalanceJson();

  const [market_0, market_1] = await fetchSpecificMarketsJson([
    arena_info.emojicoin_0_symbols,
    arena_info.emojicoin_1_symbols,
  ]).then((r) => [
    r.find((v) => v.market_address === arena_info.emojicoin_0_market_address),
    r.find((v) => v.market_address === arena_info.emojicoin_1_market_address),
  ]);

  if (!market_0 || !market_1) {
    throw new Error("Couldn't fetch arena markets.");
  }

  const [vaultBalance, { market_0_rate, market_1_rate }] = await Promise.all([
    vault_balance_promise,
    exchange_rates_promise,
  ]);

  return {
    arena_info,
    market_0,
    market_1,
    rewards_remaining: vaultBalance?.new_balance || "0",
    market_0_delta: market_0_rate ? calculateExchangeRateDelta(market_0_rate, market_0) : null,
    market_1_delta: market_1_rate ? calculateExchangeRateDelta(market_1_rate, market_1) : null,
  };
};

const fetchCachedExchangeRatesWithErrorHandling = (arena_info: DatabaseJsonType["arena_info"]) =>
  createCachedExchangeRatesAtMeleeStartFetcher(arena_info)().catch((e) => {
    console.error(
      `Couldn't fetch exchange rates at melee start for melee ID: ${arena_info.melee_id}`
    );
    console.error(e);
    return {
      market_0_rate: null,
      market_1_rate: null,
    };
  });

const cachedFetches = async () => {
  const arena_info = await fetchCachedArenaInfo().catch((e) => {
    console.error(e);
    return null;
  });

  if (!arena_info) return logAndDefault("Couldn't fetch arena info.");

  const exchange_rates_promise = fetchCachedExchangeRatesWithErrorHandling(arena_info);
  const fetchCachedCurrentMeleeData = unstable_cache(
    async () => fetchMeleeData({ arena_info, exchange_rates_promise }),
    ["current-melee-data"],
    {
      revalidate: 2,
      tags: ["current-melee-data"],
    }
  );

  return fetchCachedCurrentMeleeData().then((v) => ({
    arenaInfo: toArenaInfoModel(v.arena_info),
    market0: toMarketStateModel(v.market_0),
    market1: toMarketStateModel(v.market_1),
    rewardsRemaining: BigInt(v.rewards_remaining),
    market0Delta: v.market_0_delta,
    market1Delta: v.market_1_delta,
  }));
};

export const fetchCachedMeleeData = async () => {
  if (!FEATURE_FLAGS.Arena) throw new Error("Do not call this function when arena isn't enabled.");

  const res = await cachedFetches().catch(logAndDefault);

  if (!res.arenaInfo) console.warn(`[WARNING]: Failed to fetch melee data.`);

  return res;
};
