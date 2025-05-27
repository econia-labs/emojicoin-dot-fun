import { unstable_cache } from "next/cache";

import { EmojicoinArena } from "@/move-modules";
import type { AccountAddressString } from "@/sdk/index";
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
  version,
}: {
  market0Address: AccountAddressString;
  market1Address: AccountAddressString;
  // Must be a string or the `unstable_cache` serialization fails.
  version: string;
}) {
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
const fetchCachedExchangeRatesAtMeleeStart = unstable_cache(fetchExchangeRatesAtMeleeStart, [], {
  // Revalidate every 10 minutes to avoid permanently caching a response as a 404 response.
  revalidate: 600,
  tags: ["fetch-exchange-rates-at-melee-start"],
});

export default fetchCachedExchangeRatesAtMeleeStart;
