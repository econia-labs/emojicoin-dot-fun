import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { StatsCarousel } from "./MarketPreview";
import { AnyNumberString } from "@sdk-types";
import { calculateCirculatingSupply, calculateCurvePrice } from "@sdk/markets";
import { RowBetween } from "@containers";
import { useMemo } from "react";

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

const TableData = <T extends DatabaseModels["price_feed" | "market_state"][]>({
  data,
  k,
}: {
  data: T;
  k: Column;
}) => {
  const classNames = useMemo(
    () => ({
      delta: k === Column.PriceDelta ? "text-ec-blue" : "",
      price: k === Column.Price ? "text-ec-blue" : "",
      allTimeVolume: k === Column.AllTimeVolume ? "text-ec-blue" : "",
      dailyVolume: k === Column.DailyVolume ? "text-ec-blue" : "",
      lastAvgExecutionPrice: k === Column.LastAvgExecutionPrice ? "text-ec-blue" : "",
      tvl: k === Column.Tvl ? "text-ec-blue" : "",
      marketCap: k === Column.MarketCap ? "text-ec-blue" : "",
    }),
    [k]
  );

  return (
  <th>{data.map((row, i) => (
    <tr key={`${k}-${i}`} className="text-white text-lg font-forma">
      {"deltaPercentage" in row && <td className={classNames.delta}>{row.deltaPercentage}</td>}
      <td>{row.market.marketID}</td>
      <td className={classNames.price}>{calculateCurvePrice(row.state).toString()}</td>
      <td className={classNames.allTimeVolume}>{row.state.cumulativeStats.quoteVolume}</td>
      <td className={classNames.dailyVolume}>{row.dailyVolume}</td>
      <td className={classNames.tvl}>{row.state.instantaneousStats.totalValueLocked}</td>
      <td className={classNames.lastAvgExecutionPrice}>{row.lastSwap.avgExecutionPriceQ64}</td>
      <td className={classNames.marketCap}>{row.state.instantaneousStats.marketCap}</td>
      <td>{calculateCirculatingSupply(row.state).toString()}</td>
      <td>{row.inBondingCurve}</td>
    </tr>
  ))}
  </th>)
};

export default function StatsPageComponent(props: HomePageProps) {
  return (
    <>
      <div className="flex flex-col mb-[31px] text-white">
        <div className="flex flex-row m-auto">
          <span>{"num markets:"}</span>
          <div>{props.numMarkets}</div>
        </div>
        <div className="flex flex-col">
          <table><StatsCarousel />
            elements={[
              <th key={Column.}></th>
            ]}
            </table>

      </div>
    </>
  );
}
