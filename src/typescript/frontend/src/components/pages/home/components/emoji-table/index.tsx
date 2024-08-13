"use client";

import React, { useEffect, useMemo } from "react";

import { ButtonsBlock } from "./components";
import {
  InnerGridContainer,
  SearchWrapper,
  OuterContainer,
  FilterOptionsWrapper,
  OutermostContainer,
  StyledGrid,
  GRID_PADDING,
} from "./styled";
import SearchBar from "components/inputs/search-bar";
import FilterOptions from "./components/FilterOptions";
import { ClientGrid } from "./ClientGrid";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MarketDataSortBy, type MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { useRouter } from "next/navigation";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { encodeEmojis } from "@sdk/emoji_data";
import { useEventStore, useUserSettings } from "context/state-store-context";
import { LiveClientGrid } from "./AnimatedClientGrid";
import useEvent from "@hooks/use-event";
import { constructURLForHomePage, isHomePageURLDifferent } from "lib/queries/sorting/query-params";
import { AnimatePresence, motion } from "framer-motion";
import { EMOJI_GRID_ITEM_WIDTH } from "../const";
import { useGridRowLength } from "./hooks/use-grid-items-per-line";

export interface EmojiTableProps {
  data: FetchSortedMarketDataReturn["markets"];
  totalNumberOfMarkets: number;
  page: number;
  sortBy?: MarketDataSortByHomePage;
  searchBytes?: string;
  geoblocked: boolean;
}

const EmojiTable = (props: EmojiTableProps) => {
  const router = useRouter();

  const { data, page, sort, pages, searchBytes } = useMemo(() => {
    const { data, page, sortBy: sort } = props;
    const numMarkets = Math.max(props.totalNumberOfMarkets, 1);
    const pages = Math.ceil(numMarkets / MARKETS_PER_PAGE);
    const searchBytes = props.searchBytes ?? "";
    return { data, page, sort, pages, searchBytes };
  }, [props]);

  const addMarketData = useEventStore((s) => s.addMarketData);
  const setEmojis = useEmojiPicker((s) => s.setEmojis);
  const emojis = useEmojiPicker((s) => s.emojis);

  useEffect(() => {
    data.map((d) => addMarketData(d));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data]);

  useEffect(() => {
    const decoded = symbolBytesToEmojis(searchBytes ?? "");
    if (decoded.emojis.length > 0) {
      setEmojis(decoded.emojis.map((e) => e.emoji));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [searchBytes]);

  const pushURL = useEvent(
    (args?: { page?: number; sort?: MarketDataSortBy; emojis?: string[] }) => {
      const curr = new URLSearchParams(location.search);
      const newURL = constructURLForHomePage({
        page: args?.page ?? page,
        sort: args?.sort ?? sort,
        searchBytes: encodeEmojis(args?.emojis ?? emojis),
      });

      // Always push the new URL to the history, but only refresh if the URL has actually changed in a meaningful way.
      router.push(newURL.toString(), { scroll: false });
      if (isHomePageURLDifferent(curr, newURL.searchParams)) {
        router.refresh();
      }
    }
  );

  const handlePageChange = (page: number) => {
    const newPage = Math.min(Math.max(1, page), pages);
    pushURL({ page: newPage });
  };

  const handleSortChange = (newPage: MarketDataSortBy) => {
    pushURL({ sort: newPage });
  };

  useEffect(() => {
    pushURL();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [emojis]);

  const animationsOn = useUserSettings((s) => s.animate);

  const shouldAnimateGrid = useMemo(
    () => animationsOn && sort === MarketDataSortBy.BumpOrder && page === 1 && !searchBytes,
    [sort, page, searchBytes, animationsOn]
  );

  const rowLength = useGridRowLength();

  return (
    <OutermostContainer>
      <OuterContainer>
        <InnerGridContainer>
          <motion.div
            key={rowLength}
            id="emoji-grid-header"
            exit={{
              opacity: 0,
              transition: {
                duration: 0.5,
                type: "just",
              },
            }}
          >
            <SearchWrapper>
              <SearchBar geoblocked={props.geoblocked} />
            </SearchWrapper>
            <FilterOptionsWrapper>
              <FilterOptions
                filter={sort ?? MarketDataSortBy.MarketCap}
                onChange={handleSortChange}
              />
            </FilterOptionsWrapper>
          </motion.div>
          {/* Each version of the grid must wait for the other to fully exit animate out before appearing.
              This provides a smooth transition from grids of varying row lengths. */}
          <AnimatePresence mode="wait">
            <motion.div
              className="relative w-full h-full"
              id="emoji-grid"
              key={rowLength}
              style={{
                // We set these so the grid layout doesn't snap when the number of items per row changes.
                // This actually seems to work better than the css media queries, although I've left them in module.css
                // in case we want to use them for other things.
                maxWidth: rowLength * EMOJI_GRID_ITEM_WIDTH + GRID_PADDING * 2,
                minWidth: rowLength * EMOJI_GRID_ITEM_WIDTH + GRID_PADDING * 2,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.35,
                  type: "just",
                },
              }}
            >
              <StyledGrid>
                {shouldAnimateGrid ? (
                  <LiveClientGrid data={data} sortBy={sort ?? MarketDataSortBy.MarketCap} />
                ) : (
                  <ClientGrid data={data} page={page} sortBy={sort ?? MarketDataSortBy.MarketCap} />
                )}
              </StyledGrid>
            </motion.div>
          </AnimatePresence>
          <ButtonsBlock value={page} onChange={handlePageChange} numPages={pages} />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
