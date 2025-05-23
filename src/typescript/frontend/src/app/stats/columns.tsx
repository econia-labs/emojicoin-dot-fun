import type { StatsSchemaOutput } from "app/api/stats/schema";
import { MiniBondingCurveProgress } from "app/stats/MiniBondingCurveProgress";
import type { ClassValue } from "clsx";
import { cn } from "lib/utils/class-name";
import type { ReactNode } from "react";
import { Emoji } from "utils/emoji";

import { ExplorerLink } from "@/components/explorer-link/ExplorerLink";
import { ColoredPriceDisplay } from "@/components/misc/ColoredPriceDisplay";
import { PriceDelta } from "@/components/price-feed/inner";
import type { EcTableColumn } from "@/components/ui/table/ecTable";
import type { PriceFeedWithNullsModel } from "@/sdk/index";
import { calculateCirculatingSupply, q64ToBig, SortMarketsBy, toNominal } from "@/sdk/index";

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

const noWrap: ClassValue = "pl-6 whitespace-nowrap";

// Just a helper class for the below column creation function.
function createColumn<T>({
  label,
  node,
  cell,
}: {
  label: string;
  node?: ReactNode;
  cell: EcTableColumn<T>["renderCell"];
}) {
  // Use the label if there's no `node` provided.
  // If there's a node provided, only use it in the actual `headerContent`, otherwise
  // use the label for `id` and checking if it's server side sortable.
  // The cell itself is what's rendered in each table cell; i.e., each `td`.
  return {
    id: label,
    headerContent: node ?? <span className={cn(noWrap)}>{label}</span>,
    renderCell: cell,
    isServerSideSortable: label in columnSortStringsReverseMapping,
  };
}

export const statsHeaderColumns: EcTableColumn<PriceFeedWithNullsModel>[] = [
  createColumn({
    label: "symbol",
    // The same as above in `createColumn`, but ensure no padding left. Can't use
    // `not:first-child` because of the convoluted component tree with `EcTable`.
    node: <span className={cn(noWrap, "pl-0")}>{"symbol"}</span>,
    cell: (item) => <Emoji emojis={item.market.symbolData.symbol} />,
  }),
  createColumn({
    label: columnSortStrings.delta,
    cell: (item) =>
      typeof item.deltaPercentage === "number" ? (
        <>
          <PriceDelta delta={item.deltaPercentage} />
        </>
      ) : (
        "-"
      ),
  }),
  createColumn({
    label: columnSortStrings[SortMarketsBy.Price],
    cell: (item) => (
      <div onClick={(e) => e.stopPropagation()}>
        <ExplorerLink className="hover:underline" value={item.transaction.version} type="txn">
          <ColoredPriceDisplay price={q64ToBig(item.lastSwap.avgExecutionPriceQ64).toNumber()} />
        </ExplorerLink>
      </div>
    ),
  }),
  createColumn({
    label: columnSortStrings[SortMarketsBy.AllTimeVolume],
    cell: (item) => fmt(item.state.cumulativeStats.quoteVolume),
  }),
  createColumn({
    label: columnSortStrings[SortMarketsBy.DailyVolume],
    cell: (item) => fmt(item.dailyVolume),
  }),
  createColumn({
    label: columnSortStrings[SortMarketsBy.Tvl],
    cell: (item) => fmt(item.state.instantaneousStats.totalValueLocked),
  }),
  createColumn({
    label: columnSortStrings[SortMarketsBy.MarketCap],
    cell: (item) => fmt(item.state.instantaneousStats.marketCap),
  }),
  createColumn({
    label: "circ. supply",
    cell: (item) => fmt(calculateCirculatingSupply(item.state)),
  }),
  createColumn({
    label: "curve progress",
    cell: (item) => (
      <div onClick={(e) => e.stopPropagation()} className="m-auto pl-10 flex w-full">
        <MiniBondingCurveProgress
          symbol={item.market.symbolData.symbol}
          clammVirtualReservesQuote={item.state.clammVirtualReserves.quote}
        />
      </div>
    ),
  }),
  createColumn({ label: "market ID", cell: (item) => item.market.marketID.toString() }),
];

export default statsHeaderColumns;
