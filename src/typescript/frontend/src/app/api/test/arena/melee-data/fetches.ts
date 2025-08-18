import { fetchVaultBalanceJson } from "@/queries/index";
import type { DatabaseJsonType } from "@/sdk/indexer-v2";
import { fetchSpecificMarketsJson } from "@/sdk/indexer-v2";

import createCachedExchangeRatesAtMeleeStartFetcher from "./fetch-melee-start-open-price";

export const fetchMeleeData = async ({
  arena_info,
}: {
  arena_info: DatabaseJsonType["arena_info"];
}) => {
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

export const fetchCachedExchangeRatesWithErrorHandling = (
  arena_info: DatabaseJsonType["arena_info"]
) =>
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
