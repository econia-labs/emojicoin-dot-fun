"use client";

import "./module.css";

import type { HomePageProps } from "app/home/HomePage";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { useEffect, useMemo, useRef } from "react";

import TableCard from "../table-card/TableCard";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";
import { marketDataToProps } from "./utils";

export const ClientGrid = ({
  markets,
  page,
  sortBy,
}: {
  markets: HomePageProps["markets"];
  page: number;
  sortBy: MarketDataSortByHomePage;
}) => {
  const rowLength = useGridRowLength();

  const ordered = useMemo(() => {
    return marketDataToProps(markets);
  }, [markets]);

  const initialRender = useRef(true);

  useEffect(() => {
    initialRender.current = false;

    return () => {
      initialRender.current = true;
    };
  }, []);

  return (
    <>
      {ordered.map((v, i) => {
        return (
          <TableCard
            key={`live-${v.marketID}`}
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
            data-testid="market-grid-item"
          />
        );
      })}
    </>
  );
};
