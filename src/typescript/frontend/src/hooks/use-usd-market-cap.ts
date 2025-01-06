import { useAptPrice } from "context/AptPrice";
import { toNominal } from "lib/utils/decimals";

/**
 * Returns the market cap in USD.
 *
 * If the APT price isn't available, it will return `undefined`.
 */
export function useUsdMarketCap(marketCapInOctas: bigint): number | undefined {
  const aptPrice = useAptPrice();
  return aptPrice ? toNominal(marketCapInOctas) * aptPrice : undefined;
}
