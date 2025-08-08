import { unstable_cache } from "next/cache";

import { EmojicoinArena } from "@/move-modules";
import { fetchMeleeEventByMeleeIDJson } from "@/queries/arena";
import type { AccountAddressString, ArenaInfoModel } from "@/sdk/index";
import { getAptosClient, toEmojicoinTypesForEntry } from "@/sdk/index";

const fetchExchangeRate = (marketAddress: AccountAddressString, version: bigint) =>
  EmojicoinArena.ExchangeRate.view({
    aptos: getAptosClient(),
    marketAddress,
    typeTags: toEmojicoinTypesForEntry(marketAddress),
    options: {
      ledgerVersion: version,
    },
  });

async function fetchExchangeRatesAtMeleeStart({
  market0Address,
  market1Address,
  meleeID,
}: {
  market0Address: AccountAddressString;
  market1Address: AccountAddressString;
  // Must be a string or the `unstable_cache` serialization fails.
  meleeID: string;
}) {
  // Get the version number of when the melee started.
  const version = await fetchMeleeEventByMeleeIDJson({ meleeID }).then(
    (res) => res?.transaction_version
  );
  if (version === undefined) {
    throw new Error(`Expected arena info for the current melee with meleeID: ${meleeID}`);
  }
  const [market0ExchangeRate, market1ExchangeRate] = await Promise.all([
    fetchExchangeRate(market0Address, BigInt(version)),
    fetchExchangeRate(market1Address, BigInt(version)),
  ]);

  return {
    market0ExchangeRate,
    market1ExchangeRate,
  };
}

/**
 * Fetch the exchange rates of the two emojicoins in the melee at the exact version the melee began.
 */
const fetchCachedExchangeRatesAtMeleeStart = (arenaInfo: ArenaInfoModel) =>
  unstable_cache(
    () =>
      fetchExchangeRatesAtMeleeStart({
        market0Address: arenaInfo.emojicoin0MarketAddress,
        market1Address: arenaInfo.emojicoin1MarketAddress,
        meleeID: arenaInfo.meleeID.toString(),
      }),
    [],
    {
      // `unstable_cache` doesn't cache error responses, so just specify to cache this forever.
      revalidate: false,
      tags: ["fetch-exchange-rates-at-melee-start"],
    }
  );

export default fetchCachedExchangeRatesAtMeleeStart;
