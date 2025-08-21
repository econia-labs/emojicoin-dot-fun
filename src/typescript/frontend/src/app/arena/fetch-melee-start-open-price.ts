import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { EmojicoinArena } from "@/move-modules";
import { fetchMeleeEventByMeleeIDJson } from "@/queries/arena";
import type { AccountAddressString, DatabaseJsonType } from "@/sdk/index";
import { getAptosClient, toEmojicoinTypesForEntry } from "@/sdk/index";

const fetchExchangeRateAtVersion = (marketAddress: AccountAddressString, version: bigint) =>
  EmojicoinArena.ExchangeRate.view({
    aptos: getAptosClient(),
    marketAddress,
    typeTags: toEmojicoinTypesForEntry(marketAddress),
    options: {
      ledgerVersion: version,
    },
  });

export type MeleeExchangeRatesJson = {
  market_0_rate: Awaited<ReturnType<typeof fetchExchangeRateAtVersion>>;
  market_1_rate: Awaited<ReturnType<typeof fetchExchangeRateAtVersion>>;
};

export async function fetchExchangeRatesAtMeleeStart({
  emojicoin_0_market_address: market0Address,
  emojicoin_1_market_address: market1Address,
  melee_id: meleeID,
}: DatabaseJsonType["arena_info"]): Promise<MeleeExchangeRatesJson> {
  // Get the version number of when the melee started.
  const version = await fetchMeleeEventByMeleeIDJson({ meleeID }).then(
    (res) => res?.transaction_version
  );
  if (version === undefined) {
    throw new Error(`Expected arena info for the current melee with meleeID: ${meleeID}`);
  }
  const [market_0_rate, market_1_rate] = await Promise.all([
    fetchExchangeRateAtVersion(market0Address, BigInt(version)),
    fetchExchangeRateAtVersion(market1Address, BigInt(version)),
  ]);

  return {
    market_0_rate,
    market_1_rate,
  };
}

/**
 * Fetch the exchange rates of the two emojicoins in the melee at the exact version the melee began.
 */
const createCachedExchangeRatesAtMeleeStartFetcher = (arena_info: DatabaseJsonType["arena_info"]) =>
  unstableCacheWrapper(
    () => fetchExchangeRatesAtMeleeStart(arena_info),
    ["fetch-exchange-rates-at-melee-start"],
    {
      // `unstable_cache` doesn't cache error responses, so just specify to cache this forever.
      revalidate: false,
      tags: ["fetch-exchange-rates-at-melee-start"],
    }
  );

export default createCachedExchangeRatesAtMeleeStartFetcher;
