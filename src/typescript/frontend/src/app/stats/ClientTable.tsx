"use client";

import React, { useCallback, useMemo, useState } from "react";
import AptosIconBlack from "@icons/AptosBlack";
import { Column, TableData } from "./TableData";
import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { ChevronDown, ChevronUp } from "lucide-react";

export type ClientTableProps = {
  price: DatabaseModels["market_state"][];
  allTimeVolume: DatabaseModels["market_state"][];
  priceDelta: DatabaseModels["price_feed"][];
  dailyVolume: DatabaseModels["market_state"][];
  lastAvgExecutionPrice: DatabaseModels["market_state"][];
  tvl: DatabaseModels["market_state"][];
  marketCap: DatabaseModels["market_state"][];
};

const ColumnToTable: { [key in Column]: keyof ClientTableProps } = {
  [Column.Price]: "price" as keyof ClientTableProps,
  [Column.AllTimeVolume]: "allTimeVolume" as keyof ClientTableProps,
  [Column.PriceDelta]: "priceDelta" as keyof ClientTableProps,
  [Column.DailyVolume]: "dailyVolume" as keyof ClientTableProps,
  [Column.LastAvgExecutionPrice]: "lastAvgExecutionPrice" as keyof ClientTableProps,
  [Column.Tvl]: "tvl" as keyof ClientTableProps,
  [Column.MarketCap]: "marketCap" as keyof ClientTableProps,
};

export const ClientTable = (props: ClientTableProps) => {
  const [sortBy, setSortBy] = useState(Column.DailyVolume);
  const [reversed, setReversed] = useState(false);
  const table = useMemo(() => {
    const data = props[ColumnToTable[sortBy]];
    return <TableData data={data} k={sortBy} reversed={reversed} priceDeltas={props.priceDelta} />;
  }, [props, sortBy, reversed]);

  const getCN = useCallback(
    (col: Column) =>
      "hover:cursor-pointer" + (col === sortBy ? " bg-ec-blue bg-opacity-[0.2]" : ""),
    [sortBy]
  );
  const PossibleSortButton = ({ col, reversed }: { col: Column; reversed: boolean }) =>
    col === sortBy ? (
      <div key={`${col}-sort`} className="hover:cursor-pointer w-fit">
        {reversed ? (
          <ChevronUp className="gap-1 h-4 w-4" />
        ) : (
          <ChevronDown className="gap-1 h-4 w-4" />
        )}
      </div>
    ) : (
      <></>
    );

  const handleSortByClick = (newColumn: Column) => {
    if (sortBy !== newColumn) {
      setSortBy(newColumn);
      setReversed(false);
    } else {
      setReversed((r) => !r);
    }
  };

  return (
    <>
      <div className="flex flex-col overflow-scroll max-h-[70vh] max-w-[90vw] m-auto">
        <table
          className={
            "[&_td]:px-4 [&_td]:py-2 [&_th]:px-4 [&_th]:py-2 m-auto [&_td]:border-solid [&_th]:border-solid " +
            "[&_th]:border-[1px] [&_td]:border-[1px] [&_td]:border-dark-gray [&_th]:border-dark-gray"
          }
        >
          <thead className="text-white opacity-[.95] font-forma tracking-wide text-md whitespace-nowrap">
            <tr>
              <th>{"symbol"}</th>
              <th
                onClick={() => handleSortByClick(Column.PriceDelta)}
                className={getCN(Column.PriceDelta)}
              >
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>delta</span>
                  <PossibleSortButton col={Column.PriceDelta} reversed={reversed} />
                </div>
              </th>
              <th>{"mkt id"}</th>
              <th onClick={() => handleSortByClick(Column.Price)} className={getCN(Column.Price)}>
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>price</span>
                  <PossibleSortButton col={Column.Price} reversed={reversed} />
                </div>
              </th>
              <th
                onClick={() => handleSortByClick(Column.AllTimeVolume)}
                className={getCN(Column.AllTimeVolume)}
              >
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>all time vol</span>
                  <AptosIconBlack className="m-auto" height={13} width={13} />
                  <PossibleSortButton col={Column.AllTimeVolume} reversed={reversed} />
                </div>
              </th>
              <th
                onClick={() => handleSortByClick(Column.DailyVolume)}
                className={getCN(Column.DailyVolume)}
              >
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>daily vol</span>
                  <AptosIconBlack className="m-auto" height={13} width={13} />
                  <PossibleSortButton col={Column.DailyVolume} reversed={reversed} />
                </div>
              </th>
              <th onClick={() => handleSortByClick(Column.Tvl)} className={getCN(Column.Tvl)}>
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>tvl</span>
                  <AptosIconBlack className="m-auto" height={13} width={13} />
                  <PossibleSortButton col={Column.Tvl} reversed={reversed} />
                </div>
              </th>
              <th
                onClick={() => handleSortByClick(Column.LastAvgExecutionPrice)}
                className={getCN(Column.LastAvgExecutionPrice)}
              >
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>last avg price</span>
                  <PossibleSortButton col={Column.LastAvgExecutionPrice} reversed={reversed} />
                </div>
              </th>
              <th
                onClick={() => handleSortByClick(Column.MarketCap)}
                className={getCN(Column.MarketCap)}
              >
                <div className="flex flex-row gap-1 w-fit m-auto">
                  <span>market cap</span>
                  <AptosIconBlack className="m-auto" height={13} width={13} />
                  <PossibleSortButton col={Column.MarketCap} reversed={reversed} />
                </div>
              </th>
              <th>{"circulating supply"}</th>
              <th>{"bonding curve"}</th>
            </tr>
          </thead>
          <tbody className="">{table}</tbody>
        </table>
      </div>
    </>
  );
};
