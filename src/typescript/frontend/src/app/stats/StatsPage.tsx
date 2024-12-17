import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { StatsCarousel } from "./MarketPreview";
import { useMemo } from "react";
import { toNominal } from "lib/utils/decimals";
import { calculateCurvePrice, calculateCirculatingSupply } from "@sdk/markets";

export interface HomePageProps {
  numMarkets: number;
  priceFeedData: DatabaseModels["price_feed"][];
  marketCapData: DatabaseModels["market_state"][];
  allTimeVolumeData: DatabaseModels["market_state"][];
  latestPricesData: DatabaseModels["market_state"][];
  tvlData: DatabaseModels["market_state"][];
}

enum Column {
  Price,
  AllTimeVolume,
  PriceDelta,
  DailyVolume,
  LastAvgExecutionPrice,
  Tvl,
  MarketCap,
}

const TableData = <T extends DatabaseModels["price_feed"] | DatabaseModels["market_state"]>({
  data = [] as T[],
  k,
}: {
  data?: T[];
  k: Column;
}) => {
  const cells = useMemo(() => {
    const getCN = (col: Column) => (col === k ? "text-ec-blue bg-opacity-[0.02] bg-ec-blue" : "");
    return {
      delta: {
        cn: getCN(Column.PriceDelta),
        getValue: (v: T) => ("deltaPercentage" in v ? v.deltaPercentage.toFixed(4) : "0"),
      },
      price: {
        cn: getCN(Column.Price),
        getValue: (v: T) => calculateCurvePrice(v.state).toFixed(8),
      },
      allTimeVolume: {
        cn: getCN(Column.AllTimeVolume),
        getValue: (v: T) => toNominal(v.state.cumulativeStats.quoteVolume).toFixed(2),
      },
      dailyVolume: {
        cn: getCN(Column.DailyVolume),
        getValue: (v: T) => toNominal(v.dailyVolume).toFixed(2),
      },
      lastAvgExecutionPrice: {
        cn: getCN(Column.LastAvgExecutionPrice),
        getValue: (v: T) => v.lastSwap.avgExecutionPriceQ64.toString(),
      },
      tvl: {
        cn: getCN(Column.Tvl),
        getValue: (v: T) => v.state.instantaneousStats.totalValueLocked.toString(),
      },
      marketCap: {
        cn: getCN(Column.MarketCap),
        getValue: (v: T) => v.state.instantaneousStats.marketCap.toString(),
      },
    };
  }, [k]);

  return (
    <div className="flex flex-col overflow-scroll max-h-[70vh] max-w-[90vw] m-auto">
      <table
        className={
          "[&_td]:px-4 [&_td]:py-2 [&_th]:px-4 [&_th]:py-2 m-auto [&_td]:border-solid [&_th]:border-solid " +
          "[&_th]:border-[1px] [&_td]:border-[1px] [&_td]:border-dark-gray [&_th]:border-dark-gray"
        }
      >
        <thead>
          <tr>
            <th>{"symbol"}</th>
            {"deltaPercentage" in (data.at(0) ?? []) && <th>{"delta"}</th>}
            <th>{"market ID"}</th>
            <th>{"price"}</th>
            <th>{"allTimeVolume"}</th>
            <th>{"dailyVolume"}</th>
            <th>{"tvl"}</th>
            <th>{"lastAvgExecutionPrice"}</th>
            <th>{"market cap"}</th>
            <th>{"circulating supply"}</th>
            <th>{"in bonding curve"}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={`${k}-${i}`} className="text-lighter-gray text-sm font-forma p-3">
              <td>{row.market.symbolData.symbol}</td>
              {"deltaPercentage" in row && (
                <td className={cells.delta.cn}>{cells.delta.getValue(row)}</td>
              )}
              <td>{row.market.marketID.toString()}</td>
              <td className={cells.price.cn}>{cells.price.getValue(row)}</td>
              <td className={cells.allTimeVolume.cn}>{cells.allTimeVolume.getValue(row)}</td>
              <td className={cells.dailyVolume.cn}>{cells.dailyVolume.getValue(row)}</td>
              <td className={cells.tvl.cn}>{cells.tvl.getValue(row)}</td>
              <td className={cells.lastAvgExecutionPrice.cn}>
                {cells.lastAvgExecutionPrice.getValue(row)}
              </td>
              <td className={cells.marketCap.cn}>{cells.marketCap.getValue(row).toString()}</td>
              <td>{calculateCirculatingSupply(row.state).toString()}</td>
              <td>{row.inBondingCurve.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function StatsPageComponent(props: HomePageProps) {
  const columnToElement = {
    [Column.Price]: "latestPricesData" as keyof HomePageProps,
    [Column.AllTimeVolume]: "allTimeVolumeData" as keyof HomePageProps,
    [Column.PriceDelta]: "priceFeedData" as keyof HomePageProps,
    [Column.DailyVolume]: "priceFeedData" as keyof HomePageProps,
    [Column.LastAvgExecutionPrice]: "priceFeedData" as keyof HomePageProps,
    [Column.Tvl]: "tvlData" as keyof HomePageProps,
    [Column.MarketCap]: "marketCapData" as keyof HomePageProps,
  };
  return (
    <>
      <div className="flex flex-col mb-[31px] text-white w-full">
        <div className="flex flex-row m-auto">
          <span>{"num markets:"}</span>
          <div>{props.numMarkets}</div>
        </div>
        <StatsCarousel
          elements={Object.keys(columnToElement).map((k) => (
            <TableData
              key={`${props[k]}-${k}`}
              data={props[columnToElement[Number(k)]]}
              k={Number(k)}
            />
          ))}
        />
      </div>
    </>
  );
}
