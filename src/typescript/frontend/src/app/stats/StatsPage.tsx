import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { useMemo } from "react";
import { toNominal } from "lib/utils/decimals";
import { calculateCurvePrice, calculateCirculatingSupply } from "@sdk/markets";
import { MiniBondingCurveProgress } from "./MiniBondingCurveProgress";
import { toNominalPrice } from "@sdk/utils";
import AptosIconBlack from "@icons/AptosBlack";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { ROUTES } from "router/routes";
import { EXTERNAL_LINK_PROPS } from "components/link/const";

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

const TextWithAptosLabel = ({ text }: { text: string }) => (
  <div className="flex flex-row gap-1 w-fit m-auto">
    <span>{text}</span>
    <AptosIconBlack className="m-auto" height={13} width={13} />
  </div>
);

const TableData = <T extends DatabaseModels["price_feed"] | DatabaseModels["market_state"]>({
  data = [] as T[],
  k,
}: {
  data?: T[];
  k: Column;
}) => {
  const cells = useMemo(() => {
    const bigNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
    const fmt = (n: number) => bigNumberFormatter.format(n);
    const getCN = (col: Column) => (col === k ? "bg-opacity-[0.04] bg-ec-blue" : "");
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
            {"deltaPercentage" in (data.at(0) ?? []) && (
              <th className={cells.delta.cn ? "text-ec-blue" : ""}>{"delta"}</th>
            )}
            <th>{"mkt id"}</th>
            <th className={cells.price.cn ? "text-ec-blue" : ""}>{"price"}</th>
            <th className={cells.allTimeVolume.cn ? "text-ec-blue" : ""}>
              <TextWithAptosLabel text={"all time vol"} />
            </th>
            <th className={cells.dailyVolume.cn ? "text-ec-blue" : ""}>
              <TextWithAptosLabel text={"daily vol"} />
            </th>
            <th className={cells.tvl.cn ? "text-ec-blue" : ""}>
              <TextWithAptosLabel text={"tvl"} />
            </th>
            <th className={cells.lastAvgPrice.cn ? "text-ec-blue" : ""}>{"last avg price"}</th>
            <th className={cells.marketCap.cn ? "text-ec-blue" : ""}>
              <TextWithAptosLabel text={"market cap"} />
            </th>
            <th>{"circulating supply"}</th>
            <th>{"bonding curve"}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
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
              {"deltaPercentage" in row && (
                <td className={cells.delta.cn}>{cells.delta.getValue(row)}</td>
              )}
              <td>{row.market.marketID.toString()}</td>
              <td className={cells.price.cn}>{cells.price.getValue(row)}</td>
              <td className={cells.allTimeVolume.cn}>{cells.allTimeVolume.getValue(row)}</td>
              <td className={cells.dailyVolume.cn}>{cells.dailyVolume.getValue(row)}</td>
              <td className={cells.tvl.cn}>{cells.tvl.getValue(row)}</td>
              <td className={cells.lastAvgPrice.cn}>
                {
                  <ExplorerLink
                    className="hover:underline"
                    value={row.transaction.version}
                    type="txn"
                  >
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
          <span>{"global stats"}</span>
          <div>{"global stats go here or something"}</div>
        </div>
        {Object.keys(columnToElement).map((k) => (
          <TableData
            key={`${props[k]}-${k}`}
            data={props[columnToElement[Number(k)]]}
            k={Number(k)}
          />
        ))}
      </div>
    </>
  );
}
