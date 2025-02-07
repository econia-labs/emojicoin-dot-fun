import { MiniBondingCurveProgress } from "./MiniBondingCurveProgress";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { EXTERNAL_LINK_PROPS } from "components/link/const";
import { PriceDelta } from "components/price-feed/inner";
import { ROUTES } from "router/routes";
import { NominalPriceDisplay } from "./NominalPriceDisplay";
import { toNominal } from "lib/utils/decimals";
import { toNominalPrice } from "@sdk/utils/nominal-price";
import { StatsColumn } from "./params";
import { cn } from "lib/utils/class-name";
import { ServerSideEmoji } from "./ServerSideEmoji";

export interface TableRowData {
  symbol: string;
  marketID: bigint;
  transactionVersion: bigint;
  circulatingSupply: bigint;
  currentCurvePrice: number;
  clammVirtualReservesQuote: bigint;
  cumulativeQuoteVolume: bigint;
  dailyVolume: bigint;
  totalValueLocked: bigint;
  lastAvgPriceQ64: bigint;
  marketCap: bigint;
  priceDelta?: number;
  sort: StatsColumn;
  emojiFontClassName: string;
}

const bigNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmt = (n: bigint) => bigNumberFormatter.format(toNominal(n));

// Check if the row should be highlighted.
const getCN = (current: StatsColumn, header: StatsColumn) =>
  cn(current === header ? "bg-opacity-[0.04] bg-ec-blue" : "");

export const MarketTableRow = ({
  symbol,
  marketID,
  transactionVersion,
  circulatingSupply,
  currentCurvePrice,
  clammVirtualReservesQuote,
  cumulativeQuoteVolume,
  dailyVolume,
  totalValueLocked,
  lastAvgPriceQ64,
  marketCap,
  priceDelta,
  sort,
  emojiFontClassName,
}: TableRowData) => {
  return (
    <tr key={`${symbol}-${sort}`}>
      <td>
        <a className="hover:underline" href={`${ROUTES.market}/${symbol}`} {...EXTERNAL_LINK_PROPS}>
          <ServerSideEmoji emojiFontClassName={emojiFontClassName} emojis={symbol} />
        </a>
      </td>
      <td className={getCN(sort, StatsColumn.PriceDelta)}>
        {priceDelta !== undefined ? <PriceDelta delta={priceDelta} /> : "-"}
      </td>
      <td>
        <NominalPriceDisplay price={currentCurvePrice} />
      </td>
      <td className={getCN(sort, StatsColumn.AllTimeVolume)}>{fmt(cumulativeQuoteVolume)}</td>
      <td className={getCN(sort, StatsColumn.DailyVolume)}>{fmt(dailyVolume)}</td>
      <td className={getCN(sort, StatsColumn.Tvl)}>{fmt(totalValueLocked)}</td>
      <td className={getCN(sort, StatsColumn.LastAvgPrice)}>
        <ExplorerLink className="hover:underline" value={transactionVersion} type="txn">
          <NominalPriceDisplay price={toNominalPrice(lastAvgPriceQ64)} />
        </ExplorerLink>
      </td>
      <td className={getCN(sort, StatsColumn.MarketCap)}>{fmt(marketCap)}</td>
      <td>{fmt(circulatingSupply)}</td>
      <td>
        <MiniBondingCurveProgress
          symbol={symbol}
          clammVirtualReservesQuote={clammVirtualReservesQuote}
        />
      </td>
      <td>{marketID.toString()}</td>
    </tr>
  );
};
