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

const fetchMeleeData = async ({ arena_info }: { arena_info: DatabaseJsonType["arena_info"] }) => {
  const vault_balance_promise = fetchVaultBalanceJson();

  const specific_markets_promise = fetchSpecificMarketsJson([
    arena_info.emojicoin_0_symbols,
    arena_info.emojicoin_1_symbols,
  ]).then((r) => [
    r.find((v) => v.market_address === arena_info.emojicoin_0_market_address),
    r.find((v) => v.market_address === arena_info.emojicoin_1_market_address),
  ]);

  const [vault_balance, [market_0, market_1]] = await Promise.all([
    vault_balance_promise,
    specific_markets_promise,
  ]);

  if (!market_0 || !market_1) {
    throw new Error("Couldn't fetch arena markets.");
  }

  return {
    arena_info,
    market_0,
    market_1,
    rewards_remaining: vault_balance?.new_balance || "0",
  };
};

const fetchCachedExchangeRatesWithErrorHandling = (arena_info: DatabaseJsonType["arena_info"]) =>
  createCachedExchangeRatesAtMeleeStartFetcher(arena_info)()
    .then((res) => {
      if ("market_0_rate" in res && "market_1_rate" in res) return res;
      throw new Error(`Invalid exchange rate response: ${JSON.stringify(res)}`);
    })
    .catch((e) => {
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

  const fetchCachedCurrentMeleeData = unstable_cache(
    async () => fetchMeleeData({ arena_info }),
    ["current-melee-data"],
    {
      revalidate: 2,
      tags: ["current-melee-data"],
    }
  );

  const [melee, { market_0_rate, market_1_rate }] = await Promise.all([
    fetchCachedCurrentMeleeData(),
    fetchCachedExchangeRatesWithErrorHandling(arena_info),
  ]);

  return {
    arenaInfo: toArenaInfoModel(melee.arena_info),
    market0: toMarketStateModel(melee.market_0),
    market1: toMarketStateModel(melee.market_1),
    rewardsRemaining: BigInt(melee.rewards_remaining),
    market0Delta: market_0_rate ? calculateExchangeRateDelta(market_0_rate, melee.market_0) : null,
    market1Delta: market_1_rate ? calculateExchangeRateDelta(market_1_rate, melee.market_1) : null,
  };
};

export const fetchCachedMeleeData = async () => {
  if (!FEATURE_FLAGS.Arena) throw new Error("Do not call this function when arena isn't enabled.");

  const res = await cachedFetches().catch(logAndDefault);

  if (!res.arenaInfo) console.warn(`[WARNING]: Failed to fetch melee data.`);

  return res;
};
