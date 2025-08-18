import FEATURE_FLAGS from "lib/feature-flags";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchCachedArenaInfo } from "lib/queries/arena-info";

import { calculateExchangeRateDelta, toMarketStateModel } from "@/sdk/index";
import type { DatabaseJsonType } from "@/sdk/indexer-v2";
import {
  fetchSpecificMarketsJson,
  fetchVaultBalanceJson,
  toArenaInfoModel,
} from "@/sdk/indexer-v2";

import createCachedExchangeRatesAtMeleeStartFetcher from "./fetch-melee-start-open-price";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return {
    arena_info: null,
    market_0: null,
    market_1: null,
    rewards_remaining: null,
    market_0_delta: null,
    market_1_delta: null,
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
  const arena_info = await fetchCachedArenaInfo();
  if (!arena_info) return logAndDefault("Couldn't fetch arena info.");

  const fetchCachedCurrentMeleeData = unstableCacheWrapper(
    async () => fetchMeleeData({ arena_info }),
    ["current-melee-data"],
    {
      revalidate: 2,
      tags: ["current-melee-data"],
    }
  );

  const [{ market_0, market_1, rewards_remaining }, { market_0_rate, market_1_rate }] =
    await Promise.all([
      fetchCachedCurrentMeleeData(),
      fetchCachedExchangeRatesWithErrorHandling(arena_info),
    ]);

  return {
    arena_info,
    market_0,
    market_1,
    rewards_remaining,
    market_0_rate,
    market_1_rate,
  };
};

export const fetchCachedMeleeData = async () => {
  if (!FEATURE_FLAGS.Arena) throw new Error("Do not call this function when arena isn't enabled.");

  const res = await cachedFetches().catch(logAndDefault);

  if (!res.arena_info) console.warn(`[WARNING]: Failed to fetch melee data.`);

  return res;
};

export const convertMeleeData = (res: Awaited<ReturnType<typeof cachedFetches>>) => {
  return res.arena_info
    ? {
        arenaInfo: toArenaInfoModel(res.arena_info),
        market0: toMarketStateModel(res.market_0),
        market1: toMarketStateModel(res.market_1),
        rewardsRemaining: BigInt(res.rewards_remaining),
        market0Delta: res.market_0_rate
          ? calculateExchangeRateDelta(res.market_0_rate, res.market_0)
          : null,
        market1Delta: res.market_1_rate
          ? calculateExchangeRateDelta(res.market_1_rate, res.market_1)
          : null,
      }
    : { rewardsRemaining: 0n };
};
