import { type MarketStateModel } from "@sdk/indexer-v2/types";
import type JsonTypes from "@sdk/types/json-types";
import { toReserves } from "@sdk/types/types";

type TableRowData = {
  symbol: string;
  market_id: string;
  version: string;
  in_bonding_curve: boolean;
  clamm_virtual_reserves: JsonTypes["Reserves"];
  cpamm_real_reserves: JsonTypes["Reserves"];
  cumulative_quote_volume: string;
  daily_volume: string;
  total_value_locked: string;
  last_avg_price_q64: string;
  market_cap: string;
};

export const toJsonTableRowData = ({
  market,
  transaction,
  inBondingCurve,
  state,
  dailyVolume,
  lastSwap,
}: MarketStateModel): TableRowData => ({
  symbol: market.symbolData.symbol,
  market_id: market.marketID.toString(),
  version: transaction.version.toString(),
  in_bonding_curve: inBondingCurve,
  clamm_virtual_reserves: {
    base: state.clammVirtualReserves.base.toString(),
    quote: state.clammVirtualReserves.quote.toString(),
  },
  cpamm_real_reserves: {
    base: state.cpammRealReserves.base.toString(),
    quote: state.cpammRealReserves.quote.toString(),
  },
  cumulative_quote_volume: state.cumulativeStats.quoteVolume.toString(),
  daily_volume: dailyVolume.toString(),
  total_value_locked: state.instantaneousStats.totalValueLocked.toString(),
  last_avg_price_q64: lastSwap.avgExecutionPriceQ64.toString(),
  market_cap: state.instantaneousStats.marketCap.toString(),
});

export const toTableRowData = (row: TableRowData) => ({
  symbol: row.symbol,
  marketID: BigInt(row.market_id),
  transactionVersion: BigInt(row.version),
  inBondingCurve: row.in_bonding_curve,
  clammVirtualReserves: toReserves(row.clamm_virtual_reserves),
  cpammRealReserves: toReserves(row.cpamm_real_reserves),
  cumulativeQuoteVolume: BigInt(row.cumulative_quote_volume),
  dailyVolume: BigInt(row.daily_volume),
  totalValueLocked: BigInt(row.total_value_locked),
  lastAvgPriceQ64: BigInt(row.last_avg_price_q64),
  marketCap: BigInt(row.market_cap),
});
