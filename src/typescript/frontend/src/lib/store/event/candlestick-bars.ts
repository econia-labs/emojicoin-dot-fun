import type { Period } from "@/sdk/const";
import type {
  ArenaCandlestickModel,
  CandlestickModel,
  PeriodicStateEventModel,
} from "@/sdk/indexer-v2/types";
import { isPeriodicStateEventModel } from "@/sdk/indexer-v2/types";
import { toNominal } from "@/sdk/utils";
import { q64ToBig } from "@/sdk/utils/nominal-price";

export type BarWithNonce = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  nonce: bigint;
};

export type LatestBar = BarWithNonce & {
  period: Period;
};

/**
 * These candlestick models are emitted once per transaction block, so the comparator nonce can just
 * be the candlestick's latest transaction version.
 */
export const getCandlestickModelNonce = (model: ArenaCandlestickModel | CandlestickModel) =>
  model.version;

export function toBarWithNonce(
  event: PeriodicStateEventModel | ArenaCandlestickModel | CandlestickModel
): BarWithNonce {
  return isPeriodicStateEventModel(event)
    ? {
        time: Number(event.periodicMetadata.startTime / 1000n),
        open: q64ToBig(event.periodicState.openPriceQ64).toNumber(),
        high: q64ToBig(event.periodicState.highPriceQ64).toNumber(),
        low: q64ToBig(event.periodicState.lowPriceQ64).toNumber(),
        close: q64ToBig(event.periodicState.closePriceQ64).toNumber(),
        volume: toNominal(event.periodicState.volumeQuote),
        nonce: event.market.marketNonce,
      }
    : {
        time: event.startTime.getTime(),
        open: event.openPrice,
        high: event.highPrice,
        low: event.lowPrice,
        close: event.closePrice,
        volume: toNominal(event.volume),
        nonce: getCandlestickModelNonce(event),
      };
}
