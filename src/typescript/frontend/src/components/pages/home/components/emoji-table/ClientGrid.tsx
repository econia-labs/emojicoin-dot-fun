"use client";

import TableCard from "../table-card/TableCard";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { marketDataToProps } from "./utils";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";
import MemoizedGridRowLines from "./components/grid-row-lines";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { useEffect, useMemo, useRef } from "react";
import "./module.css";

export const ClientGrid = ({
  data,
  page,
  sortBy,
}: {
  data: FetchSortedMarketDataReturn["markets"];
  page: number;
  sortBy: MarketDataSortByHomePage;
}) => {
  const rowLength = useGridRowLength();

  const ordered = useMemo(() => {
    return marketDataToProps(data);
  }, [data]);

  const initialRender = useRef(true);

  useEffect(() => {
    initialRender.current = false;

    return () => {
      initialRender.current = true;
    };
  }, []);

  return (
    <>
      <MemoizedGridRowLines
        gridRowLinesKey={`${sortBy}-grid-lines`}
        length={ordered.length}
        shouldAnimate={initialRender.current}
      />
      {ordered.map((v, i) => {
        return (
          <TableCard
            key={`${sortBy}-${v.marketID}-${i}`}
            index={i}
            pageOffset={(page - 1) * MARKETS_PER_PAGE}
            marketID={v.marketID}
            symbol={v.symbol}
            emojis={v.emojis}
            staticMarketCap={v.staticMarketCap}
            staticVolume24H={v.staticVolume24H}
            rowLength={rowLength}
            prevIndex={i}
            runInitialAnimation={true}
            sortBy={sortBy}
          />
        );
      })}
    </>
  );
};
