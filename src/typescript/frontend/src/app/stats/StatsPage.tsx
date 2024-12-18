import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { StatsCarousel } from "./MarketPreview";
import { useMemo } from "react";
import { toCoinDecimalString, toNominal } from "lib/utils/decimals";
import { calculateCurvePrice, calculateCirculatingSupply, toCoinTypes } from "@sdk/markets";
import { MiniBondingCurveProgress } from "./MiniBondingCurveProgress";
import { toNominalPrice } from "@sdk/utils";
import AptosIconBlack from "@icons/AptosBlack";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";

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
    const getCN = (col: Column) => (col === k ? "text-ec-blue bg-opacity-[0.04] bg-ec-blue" : "");
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
      lastAvgPrice: {
        cn: getCN(Column.LastAvgExecutionPrice),
        getValue: (v: T) => toNominalPrice(v.lastSwap.avgExecutionPriceQ64).toFixed(8),
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
        <thead className="text-white opacity-[.95] font-forma tracking-wide text-md">
          <tr>
            <th>{"symbol"}</th>
            {"deltaPercentage" in (data.at(0) ?? []) && <th>{"delta"}</th>}
            <th>{"mkt id"}</th>
            <th>{"price"}</th>
            <th>
              <div className="flex flex-row gap-1 w-fit m-auto">
                <span>{"all time vol"}</span>
                <AptosIconBlack className="m-auto" height={13} width={13} />
              </div>
            </th>
            <th>
              <div className="flex flex-row gap-1 w-fit m-auto">
                <span>{"daily vol"}</span>
                <AptosIconBlack className="m-auto" height={13} width={13} />
              </div>
            </th>

            <th>
              <div className="flex flex-row gap-1 w-fit m-auto">
                <span>{"tvl"}</span>
                <AptosIconBlack className="m-auto" height={13} width={13} />
              </div>
            </th>

            <th>{"last avg price"}</th>

            <th>
              <div className="flex flex-row gap-1 w-fit m-auto">
                <span>{"market cap"}</span>
                <AptosIconBlack className="m-auto" height={13} width={13} />
              </div>
            </th>
            <th>{"circulating supply"}</th>
            <th>{"bonding curve"}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={`${k}-${i}`} className="text-lighter-gray text-sm font-forma p-3">
              <td>
                {
                  <ExplorerLink
                    value={toCoinTypes(row.market.marketAddress).emojicoin.toString()}
                    type="coin"
                  >
                    {row.market.symbolData.symbol}
                  </ExplorerLink>
                }
              </td>
              {"deltaPercentage" in row && (
                <td className={cells.delta.cn}>{cells.delta.getValue(row)}</td>
              )}
              <td>{row.market.marketID.toString()}</td>
              <td className={cells.price.cn}>{cells.price.getValue(row)}</td>
              <td className={cells.allTimeVolume.cn}>{cells.allTimeVolume.getValue(row)}</td>
              <td className={cells.dailyVolume.cn}>{cells.dailyVolume.getValue(row)}</td>
              <td className={cells.tvl.cn}>{toCoinDecimalString(cells.tvl.getValue(row), 2)}</td>
              <td className={cells.lastAvgPrice.cn}>{cells.lastAvgPrice.getValue(row)}</td>
              <td className={cells.marketCap.cn}>
                {toCoinDecimalString(cells.marketCap.getValue(row).toString(), 2)}
              </td>
              <td>{toCoinDecimalString(calculateCirculatingSupply(row.state).toString(), 2)}</td>
              <td>
                <MiniBondingCurveProgress state={row.state} />
              </td>
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
      <div className="flex flex-col mb-[31px] opacity-[.95] w-full">
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
