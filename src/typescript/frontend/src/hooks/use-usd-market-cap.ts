import { useAptPrice } from "context/AptPrice";
import { toNominal } from "lib/utils/decimals";

/**
 * Returns the market cap in USD.
 *
 * If the APT price isn't available, it will return `undefined`.
 */
export function useUsdMarketCap(marketCapInOctas: bigint): number | undefined {
  const aptPrice = useAptPrice();
  const aptInUsd = aptPrice ? toNominal(marketCapInOctas) * aptPrice : undefined;

  // Remove decimals if market cap is over 1 million
  if (aptInUsd && aptInUsd >= 1_000_000) {
    return Math.floor(aptInUsd);
  }

  return aptInUsd;
}
