"use client";

import TableCard from "../table-card/TableCard";
import { StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { motion } from "framer-motion";
import { marketDataToProps } from "./utils";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";
import MemoizedGridRowLines from "./components/grid-row-lines";
import "./module.css";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";

export const ClientGrid = ({
  data,
  page,
  sortBy,
}: {
  data: FetchSortedMarketDataReturn["markets"];
  page: number;
  sortBy: MarketDataSortByHomePage;
}) => {
  const ordered = marketDataToProps(data);
  const rowLength = useGridRowLength();

  return (
    <>
      <motion.div className="relative w-full h-full">
        <StyledGrid>
          <MemoizedGridRowLines gridRowLinesKey={`${sortBy}-grid-lines`} length={ordered.length} />
          {ordered.map((v, i) => {
            return (
              <TableCard
                key={`${sortBy}-${v.key}`}
                index={i}
                pageOffset={(page - 1) * MARKETS_PER_PAGE}
                marketID={v.marketID}
                symbol={v.symbol}
                emojis={v.emojis}
                staticNumSwaps={v.staticNumSwaps}
                staticMarketCap={v.staticMarketCap}
                staticVolume24H={v.staticVolume24H}
                rowLength={rowLength}
                prevIndex={i}
                runInitialAnimation={true}
                sortBy={sortBy}
              />
            );
          })}
        </StyledGrid>
      </motion.div>
    </>
  );
};
