import { type Types } from "@sdk-types";
import { type MarketStateModel } from "@sdk/indexer-v2/types";
import { compareBigInt, compareNumber, sum } from "@sdk/utils";
import { MS_IN_ONE_DAY } from "components/charts/const";
import Big from "big.js";
import { ONE_APT_BIGINT } from "@sdk/const";
import { toCoinDecimalString } from "lib/utils/decimals";

const normalizeCoinDecimal = (n: bigint) => Number(toCoinDecimalString(n));

export type GlobalStats = {
  numMarkets: bigint;
  numPostBondingCurve: number;
  numInBondingCurve: number;
  numSignificantMarketCap: number;
  numLowMarketCap: number;
  cumulativeDailyVolume: number;
  cumulativeSwaps: bigint;
  cumulativeChatMessages: bigint;
  numRecentlyActive: number;
  numRecentlyTraded: number;
  lastBumpTime: Date | undefined;
  lastMarketRegistered: string | undefined;
  lastMarketRegister: Date | undefined;
  cumulativeQuoteVolume: number;
  totalQuoteLocked: number;
  totalValueLocked: number;
  fullyDilutedValue: number;
  cumulativeIntegratorFees: number;
  marketCap: number;
  globalNonce: bigint;
};

export const calculateGlobalStats = ({
  allMarketData,
  registryResource,
}: {
  allMarketData: MarketStateModel[];
  registryResource: Types["RegistryView"];
}): GlobalStats => {
  return {
    numMarkets: registryResource.numMarkets,
    cumulativeDailyVolume: normalizeCoinDecimal(sum(allMarketData.map((v) => v.dailyVolume))),
    numPostBondingCurve: allMarketData.filter((v) => !v.inBondingCurve).length,
    numInBondingCurve: allMarketData.filter((v) => v.inBondingCurve).length,
    numSignificantMarketCap: allMarketData.filter(
      (v) => v.state.instantaneousStats.marketCap >= 100n * ONE_APT_BIGINT
    ).length,
    numLowMarketCap: allMarketData.filter(
      (v) => v.state.instantaneousStats.marketCap < 100n * ONE_APT_BIGINT
    ).length,
    lastBumpTime: allMarketData
      .map((v) => v.transaction.timestamp)
      .sort((a, b) => compareNumber(a.getTime(), b.getTime()))
      .at(-1),
    numRecentlyActive: allMarketData.filter(({ transaction }) =>
      Big(transaction.time.toString())
        .div(1000)
        .gt(new Date().getTime() - MS_IN_ONE_DAY)
    ).length,
    numRecentlyTraded: allMarketData.filter(({ lastSwap }) =>
      Big(lastSwap.time.toString())
        .div(1000)
        .gt(new Date().getTime() - MS_IN_ONE_DAY)
    ).length,
    cumulativeQuoteVolume: normalizeCoinDecimal(registryResource.cumulativeQuoteVolume),
    cumulativeIntegratorFees: normalizeCoinDecimal(registryResource.cumulativeIntegratorFees),
    cumulativeSwaps: registryResource.cumulativeSwaps,
    cumulativeChatMessages: registryResource.cumulativeChatMessages,
    totalQuoteLocked: normalizeCoinDecimal(registryResource.totalQuoteLocked),
    totalValueLocked: normalizeCoinDecimal(registryResource.totalValueLocked),
    marketCap: normalizeCoinDecimal(registryResource.marketCap),
    fullyDilutedValue: normalizeCoinDecimal(registryResource.fullyDilutedValue),
    globalNonce: registryResource.nonce,
    lastMarketRegister: allMarketData
      .sort((a, b) => compareBigInt(a.market.marketID, b.market.marketID))
      .at(-1)?.transaction.timestamp,
    lastMarketRegistered: allMarketData
      .sort((a, b) => compareBigInt(a.market.marketID, b.market.marketID))
      .at(-1)?.market.symbolData.symbol,
  };
};
