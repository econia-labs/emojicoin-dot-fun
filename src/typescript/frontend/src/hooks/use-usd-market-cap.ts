import { useAptPrice } from "context/AptPrice";
import { toNominal } from "lib/utils/decimals";

// Returns market cap in USD.
// If the APT price isn't available, undefined will be returned.
export function useUsdMarketCap(marketCapInOctas: bigint): number | undefined {
  const aptPrice = useAptPrice();
  return aptPrice ? toNominal(marketCapInOctas) * aptPrice : undefined;
}
