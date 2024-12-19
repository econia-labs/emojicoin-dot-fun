import { useMemo } from "react";
import { toNominal } from "lib/utils/decimals";
import { calculateCurvePrice, calculateCirculatingSupply } from "@sdk/markets";
import { MiniBondingCurveProgress } from "./MiniBondingCurveProgress";
import { toNominalPrice } from "@sdk/utils";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { ROUTES } from "router/routes";
import { EXTERNAL_LINK_PROPS } from "components/link/const";
import { type DatabaseModels } from "@sdk/indexer-v2/types";

export enum Column {
  Price,
  AllTimeVolume,
  PriceDelta,
  DailyVolume,
  LastAvgExecutionPrice,
  Tvl,
  MarketCap,
}

export const TableData = <T extends DatabaseModels["price_feed"] | DatabaseModels["market_state"]>({
  data = [] as T[],
  k,
  reversed,
  priceDeltas,
}: {
  data?: T[];
  k: Column;
  reversed: boolean;
  priceDeltas: DatabaseModels["price_feed"][];
}) => {
  const { cells, tableData } = useMemo(() => {
    const deltaByMarket = new Map(
      priceDeltas.map(({ deltaPercentage, market }) => [market.symbolData.symbol, deltaPercentage])
    );
    const bigNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
    const fmt = (n: number) => bigNumberFormatter.format(n);
    const getCN = (col: Column) => (col === k ? "bg-opacity-[0.04] bg-ec-blue" : "");
    return {
      cells: {
        delta: {
          cn: getCN(Column.PriceDelta),
          getValue: (v: T) => deltaByMarket.get(v.market.symbolData.symbol)?.toFixed(4) ?? "-",
        },
        price: {
          cn: getCN(Column.Price),
          getValue: (v: T) => calculateCurvePrice(v.state).toFixed(8),
        },
        allTimeVolume: {
          cn: getCN(Column.AllTimeVolume),
          getValue: (v: T) => fmt(toNominal(v.state.cumulativeStats.quoteVolume)),
        },
        dailyVolume: {
          cn: getCN(Column.DailyVolume),
          getValue: (v: T) => fmt(toNominal(v.dailyVolume)),
        },
        lastAvgPrice: {
          cn: getCN(Column.LastAvgExecutionPrice),
          getValue: (v: T) => toNominalPrice(v.lastSwap.avgExecutionPriceQ64).toFixed(8),
        },
        tvl: {
          cn: getCN(Column.Tvl),
          getValue: (v: T) => fmt(toNominal(v.state.instantaneousStats.totalValueLocked)),
        },
        marketCap: {
          cn: getCN(Column.MarketCap),
          getValue: (v: T) => fmt(toNominal(v.state.instantaneousStats.marketCap)),
        },
        getCirculatingSupply: (v: T) => fmt(toNominal(calculateCirculatingSupply(v.state))),
      },
      tableData: reversed ? data.toReversed() : data,
    };
  }, [k, reversed, priceDeltas, data]);

  return tableData.map((row, i) => (
    <tr
      key={`${k}-${i}`}
      className="text-lighter-gray text-sm font-forma p-3 hover:bg-ec-blue hover:bg-opacity-5"
    >
      <td>
        <a
          className="hover:underline"
          href={`${ROUTES.market}/${row.market.symbolData.symbol}`}
          {...EXTERNAL_LINK_PROPS}
        >
          {row.market.symbolData.symbol}
        </a>
      </td>
      <td className={cells.delta.cn}>{cells.delta.getValue(row)}</td>
      <td>{row.market.marketID.toString()}</td>
      <td className={cells.price.cn}>{cells.price.getValue(row)}</td>
      <td className={cells.allTimeVolume.cn}>{cells.allTimeVolume.getValue(row)}</td>
      <td className={cells.dailyVolume.cn}>{cells.dailyVolume.getValue(row)}</td>
      <td className={cells.tvl.cn}>{cells.tvl.getValue(row)}</td>
      <td className={cells.lastAvgPrice.cn}>
        {
          <ExplorerLink className="hover:underline" value={row.transaction.version} type="txn">
            {cells.lastAvgPrice.getValue(row)}
          </ExplorerLink>
        }
      </td>
      <td className={cells.marketCap.cn}>{cells.marketCap.getValue(row)}</td>
      <td>{cells.getCirculatingSupply(row)}</td>
      <td>
        <MiniBondingCurveProgress state={row.state} />
      </td>
    </tr>
  ));
};
