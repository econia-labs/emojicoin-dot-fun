"use client";

import { useMemo } from "react";
import TableCard from "../table-card/TableCard";
import { GRID_PADDING, GridRowBorders, StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { EMOJI_GRID_ITEM_HEIGHT, EMOJI_GRID_ITEM_WIDTH } from "../const";
import { motion } from "framer-motion";
import { marketDataToProps } from "./utils";
import { useWindowSize } from "react-use";
import "./module.css";

export const MAX_ELEMENTS_PER_LINE = 7;

export const ClientGrid = ({
  data,
  page,
}: {
  data: FetchSortedMarketDataReturn["markets"];
  page: number;
}) => {
  const ordered = marketDataToProps(data);
  const { width } = useWindowSize();
  const itemsPerLine = useMemo(() => {
    const num = Math.floor((width - GRID_PADDING * 2) / EMOJI_GRID_ITEM_WIDTH);
    return Math.min(num, MAX_ELEMENTS_PER_LINE);
  }, [width]);

  return (
    <>
      <motion.div className="relative w-full h-full">
        <StyledGrid>
          <GridRowBorders>
            {/* To prevent auto-scrolling to the top of the page when the elements re-order, we provide
             a static grid of horizontal lines that are the same height as the emoji grid items. */}
            {Array.from({ length: ordered.length }).map((_, i) => (
              <div
                key={`${i}-non-live-clone-for-grid-lines`}
                className={"horizontal-grid-line"}
                style={{
                  width: EMOJI_GRID_ITEM_WIDTH,
                  height: EMOJI_GRID_ITEM_HEIGHT,
                }}
              />
            ))}
          </GridRowBorders>
          {ordered.map((v, i) => {
            return (
              <TableCard
                key={v.key}
                index={i + 1}
                pageOffset={(page - 1) * MARKETS_PER_PAGE}
                marketID={v.marketID}
                symbol={v.symbol}
                emojis={v.emojis}
                staticNumSwaps={v.staticNumSwaps}
                staticMarketCap={v.staticMarketCap}
                staticVolume24H={v.staticVolume24H}
                itemsPerLine={itemsPerLine}
                prevIndex={i + 1}
                runInitialAnimation={true}
              />
            );
          })}
        </StyledGrid>
      </motion.div>
    </>
  );
};
