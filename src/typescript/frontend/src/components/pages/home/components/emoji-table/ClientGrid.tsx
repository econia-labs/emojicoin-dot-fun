"use client";

import TableCard from "../table-card/TableCard";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { marketDataToProps } from "./utils";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { useEffect, useMemo, useRef } from "react";
import "./module.css";
import { useEmojiPicker } from "context/emoji-picker-context";
import { type HomePageProps } from "app/home/HomePage";

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
  const searchEmojis = useEmojiPicker((s) => s.emojis);

  const ordered = useMemo(() => {
    return marketDataToProps(markets, searchEmojis);
  }, [markets, searchEmojis]);

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
            key={`live-${v.marketID}-${v.searchEmojisKey}`}
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
