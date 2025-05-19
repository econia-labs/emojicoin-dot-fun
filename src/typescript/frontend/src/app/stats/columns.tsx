import type { StatsSchemaOutput } from "app/api/stats/schema";
import { MiniBondingCurveProgress } from "app/stats/MiniBondingCurveProgress";
import { Emoji } from "utils/emoji";

import { ExplorerLink } from "@/components/explorer-link/ExplorerLink";
import { ColoredPriceDisplay } from "@/components/misc/ColoredPriceDisplay";
import type { EcTableColumn } from "@/components/ui/table/ecTable";
import type { PartialPriceFeedModel } from "@/sdk/index";
import { calculateCirculatingSupply, q64ToBig, SortMarketsBy, toNominal } from "@/sdk/index";
import { PriceDelta } from "@/components/price-feed/inner";

const bigNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmt = (n: bigint) => bigNumberFormatter.format(toNominal(n));

/**
 * Output search params (for the `/stats` page) to column header strings.
 */
export const columnSortStrings = {
  delta: "Δ 24h",
  [SortMarketsBy.Price]: "price",
  [SortMarketsBy.AllTimeVolume]: "all-time vol",
  [SortMarketsBy.DailyVolume]: "24h vol",
  [SortMarketsBy.Tvl]: "tvl",
  [SortMarketsBy.MarketCap]: "market cap",
} as const;

/**
 * Column header strings to output search params, for the `/stats` page.
 */
export const columnSortStringsReverseMapping: Record<
  (typeof columnSortStrings)[keyof typeof columnSortStrings],
  StatsSchemaOutput["sortBy"]
> = {
  "Δ 24h": "delta",
  price: SortMarketsBy.Price,
  "all-time vol": SortMarketsBy.AllTimeVolume,
  "24h vol": SortMarketsBy.DailyVolume,
  tvl: SortMarketsBy.Tvl,
  "market cap": SortMarketsBy.MarketCap,
};

function createColumn<T>(header: string, renderCell: EcTableColumn<T>["renderCell"]) {
  return {
    id: header,
    text: header,
    renderCell,
    isServerSideSortable: header in columnSortStringsReverseMapping,
  };
}

export const statsHeaderColumns: EcTableColumn<PartialPriceFeedModel>[] = [
  createColumn("symbol", (item) => <Emoji emojis={item.market.symbolData.symbol} />),
  createColumn(columnSortStrings.delta, (item) =>
    typeof item.deltaPercentage === "number" ? (
      <>
        <PriceDelta delta={item.deltaPercentage} />
      </>
    ) : (
      "--"
    )
  ),
  createColumn(columnSortStrings[SortMarketsBy.Price], (item) => (
    <ExplorerLink className="hover:underline" value={item.transaction.version} type="txn">
      <ColoredPriceDisplay price={q64ToBig(item.lastSwap.avgExecutionPriceQ64).toNumber()} />
    </ExplorerLink>
  )),
  createColumn(columnSortStrings[SortMarketsBy.AllTimeVolume], (item) =>
    fmt(item.state.cumulativeStats.quoteVolume)
  ),
  createColumn(columnSortStrings[SortMarketsBy.DailyVolume], (item) => fmt(item.dailyVolume)),
  createColumn(columnSortStrings[SortMarketsBy.Tvl], (item) =>
    fmt(item.state.instantaneousStats.totalValueLocked)
  ),
  createColumn(columnSortStrings[SortMarketsBy.MarketCap], (item) =>
    fmt(item.state.instantaneousStats.marketCap)
  ),
  createColumn("circ. supply", (item) => fmt(calculateCirculatingSupply(item.state))),
  createColumn("curve progress", (item) => (
    <div className="m-auto pl-10 flex w-full">
      <MiniBondingCurveProgress
        symbol={item.market.symbolData.symbol}
        clammVirtualReservesQuote={item.state.clammVirtualReserves.quote}
      />
    </div>
  )),
  createColumn("market ID", (item) => item.market.marketID.toString()),
];

export default statsHeaderColumns;
