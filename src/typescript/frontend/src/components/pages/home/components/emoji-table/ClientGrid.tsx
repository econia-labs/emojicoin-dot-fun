"use client";

import { useEffect, useInsertionEffect, useMemo, useRef, useState } from "react";
import TableCard from "../table-card/TableCard";
import { GRID_PADDING, GridRowBorders, StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { EMOJI_GRID_ITEM_HEIGHT, EMOJI_GRID_ITEM_WIDTH } from "../const";
import { AnimatePresence, motion } from "framer-motion";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { constructOrdered, type WithTimeIndexAndShouldAnimate } from "./utils";
import { MarketDataSortBy } from "lib/queries/sorting/types";
import { useWindowSize } from "react-use";
import { sum } from "@sdk/utils/misc";
import "./module.css";
import { useEmojiPicker } from "context/emoji-picker-context";

export const ANIMATION_DEBOUNCE_TIME = 3333;
export const MAX_ELEMENTS_PER_LINE = 7;

export const ClientGrid = ({
  data,
  page,
  numPages,
  sortBy,
}: {
  data: FetchSortedMarketDataReturn["markets"];
  page: number;
  numPages: number;
  sortBy: MarketDataSortBy;
}) => {
  const sortByBumpOrder = useMemo(() => sortBy === MarketDataSortBy.BumpOrder, [sortBy]);
  const getMarket = useEventStore((s) => s.getMarket);
  const getSearchEmojis = useEmojiPicker((s) => s.getEmojis);
  const stateFirehose = useEventStore((s) => s.stateFirehose);
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const unsubscribe = useWebSocketClient((s) => s.unsubscribe);
  const sortByNonce = useRef(0);
  const latestOrdered = useRef(
    constructOrdered({
      data,
      stateFirehose,
      sortByBumpOrder,
      getMarket,
      getSearchEmojis,
    })
  );
  const [ordered, setOrdered] = useState<
    Array<WithTimeIndexAndShouldAnimate & { runInitialAnimation?: boolean }>
  >(
    latestOrdered.current.map((v) => ({
      ...v,
      runInitialAnimation: true,
      sortByNonce: sortByNonce.current,
      // To avoid a re-render immediately, we set the nonce to be the current nonce + 1,
      // that way the first setInterval doesn't immediately update the list for no reason.
      key: `${v.marketID}-${sortByNonce.current + 1}`,
    }))
  );

  const { width } = useWindowSize();
  const itemsPerLine = useMemo(() => {
    const num = Math.floor((width - GRID_PADDING * 2) / EMOJI_GRID_ITEM_WIDTH);
    return Math.min(num, MAX_ELEMENTS_PER_LINE);
  }, [width]);

  // Construct `latestOrdered` as a ref. Update `ordered` to be `latestOrdered` on an interval.
  useEffect(() => {
    latestOrdered.current = constructOrdered({
      data,
      stateFirehose,
      sortByBumpOrder,
      getMarket,
      getSearchEmojis,
    });
  }, [data, stateFirehose, getMarket, getSearchEmojis, sortByBumpOrder]);

  // Update the ordered list on an interval to ensure that the list is always up-to-date, but also to
  // make sure that we don't interrupt the animation as well.
  useInsertionEffect(() => {
    if (page !== 1) {
      setOrdered(latestOrdered.current);
      return () => {};
    }
    let first = true;
    const interval = setInterval(() => {
      setOrdered((previousOrdered) => {
        // Map the previous ordered list's symbols to its index.
        const prevSymbols = new Map<number, number>(
          previousOrdered.map((v) => [v.marketID, v.index])
        );
        // Add the previous index to the new ordered list we'll display visually.
        // That is, we're updating the list to be the most updated list of elements but with the previous index
        // that's currently being displayed. We use this information to decide how to animate the element.
        const withPrev = latestOrdered.current.map((latestValue) => ({
          ...latestValue,
          prevIndex: prevSymbols.get(latestValue.marketID),
          key: `${latestValue.marketID}-${sortByNonce.current}`,
          runInitialAnimation: first,
        }));
        // If we're not on the first interval, and the number of elements that are not animating is greater than 20,
        // we should animate all of them.
        // We only check `first` to avoid a needless loop.
        if (!first && sum(withPrev.map((v) => (typeof v.prevIndex === "undefined" ? 1 : 0))) > 20) {
          return withPrev.map((v) => ({
            ...v,
            runInitialAnimation: true,
          }));
        }
        first = false;
        return withPrev;
      });
    }, ANIMATION_DEBOUNCE_TIME);

    sortByNonce.current += 1;

    return () => clearInterval(interval);
  }, [sortBy, page]);

  useEffect(() => {
    console.log(ordered.slice(0, 5));
    console.log(ordered.at(-1));
  }, [ordered]);

  // Handle subscribing/unsubscribing to/from all state events across all markets on component mount/unmount.
  // 1. If we're sorting by anything but bump order, we can display new activity
  // on the current page because it's the last page. The data appended should always
  // be last in the list.
  // 2. NOTE: If it's the last page and the ordered.length exceeds the number of markets per page, we can continue
  // to subscribe, because the data will naturally evict (by slicing) elements that would appear on the next page.
  // 3. If we're sorting by bump order, we only want to subscribe to state events if we're on the first page.
  useEffect(() => {
    // We subscribe to state events if we're on the first page and sorting by bump order or if
    // we're on the last page and not sorting by bump order.
    if ((!sortByBumpOrder && page === numPages) || page === 1) {
      subscribe.state(null);
    } else {
      unsubscribe.state(null);
    }

    return () => unsubscribe.state(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [sortByBumpOrder, page, numPages]);

  return (
    <>
      <motion.div className="relative w-full h-full">
        <StyledGrid>
          <GridRowBorders>
            {/* To prevent auto-scrolling to the top of the page when the elements re-order, we provide
             a static grid of horizontal lines that are the same height as the emoji grid items. */}
            {Array.from({ length: ordered.length }).map((_, i) => (
              <div
                key={`${i}-clone-for-grid-lines`}
                className={"horizontal-grid-line"}
                style={{
                  width: EMOJI_GRID_ITEM_WIDTH,
                  height: EMOJI_GRID_ITEM_HEIGHT,
                }}
              />
            ))}
          </GridRowBorders>
          <AnimatePresence mode="popLayout">
            {ordered.map((v) => {
              return (
                <TableCard
                  key={v.key}
                  index={v.index}
                  pageOffset={(page - 1) * MARKETS_PER_PAGE}
                  marketID={v.marketID}
                  symbol={v.symbol}
                  emojis={v.emojis}
                  staticNumSwaps={v.staticNumSwaps}
                  staticMarketCap={v.staticMarketCap}
                  staticVolume24H={v.staticVolume24H}
                  itemsPerLine={itemsPerLine}
                  prevIndex={v.prevIndex}
                  runInitialAnimation={v.runInitialAnimation}
                />
              );
            })}
          </AnimatePresence>
        </StyledGrid>
      </motion.div>
    </>
  );
};
