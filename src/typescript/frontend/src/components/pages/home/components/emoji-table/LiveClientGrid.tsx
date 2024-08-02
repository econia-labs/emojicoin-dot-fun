"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import TableCard from "../table-card/TableCard";
import { GRID_PADDING, GridRowBorders, StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { EMOJI_GRID_ITEM_HEIGHT, EMOJI_GRID_ITEM_WIDTH } from "../const";
import { motion } from "framer-motion";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { constructOrdered, type WithTimeIndexAndShouldAnimate } from "./utils";
import { useWindowSize } from "react-use";
import { useEmojiPicker } from "context/emoji-picker-context";
import "./module.css";

export const ANIMATION_DEBOUNCE_TIME = 3333;
export const MAX_ELEMENTS_PER_LINE = 7;

export const LiveClientGrid = ({ data }: { data: FetchSortedMarketDataReturn["markets"] }) => {
  const getMarket = useEventStore((s) => s.getMarket);
  const getSearchEmojis = useEmojiPicker((s) => s.getEmojis);
  const stateFirehose = useEventStore((s) => s.stateFirehose);
  const subscribe = useWebSocketClient((s) => s.subscribe);
  const unsubscribe = useWebSocketClient((s) => s.unsubscribe);
  const latestOrdered = useRef(
    constructOrdered({
      data,
      stateFirehose,
      getMarket,
      getSearchEmojis,
    })
  );
  const [ordered, setOrdered] = useState<
    Array<WithTimeIndexAndShouldAnimate & { runInitialAnimation?: boolean }>
  >(
    constructOrdered({
      data,
      stateFirehose,
      getMarket,
      getSearchEmojis,
    }).map((v) => ({
      ...v,
      runInitialAnimation: true,
    }))
  );

  useLayoutEffect(() => {
    setOrdered(
      constructOrdered({
        data,
        stateFirehose,
        getMarket,
        getSearchEmojis,
      }).map((v) => ({
        ...v,
        runInitialAnimation: true,
      }))
    );
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const { width } = useWindowSize();
  const itemsPerLine = useMemo(() => {
    const num = Math.floor((width - GRID_PADDING * 2) / EMOJI_GRID_ITEM_WIDTH);
    return Math.min(num, MAX_ELEMENTS_PER_LINE);
  }, [width]);

  // Construct `latestOrdered` as a ref. Update `ordered` to be `latestOrdered` on an interval.
  useLayoutEffect(() => {
    latestOrdered.current = constructOrdered({
      data,
      stateFirehose,
      getMarket,
      getSearchEmojis,
    });
  }, [data, stateFirehose, getMarket, getSearchEmojis]);

  // Update the ordered list on an interval to ensure that the list is always up-to-date, but also to
  // make sure that we don't interrupt the animation as well.
  useEffect(() => {
    const interval = setInterval(() => {
      setOrdered((previousOrdered) => {
        // Map the previous ordered list's symbols to its index.
        const prevSymbols = new Map<number, number>(
          previousOrdered.map((v) => [v.marketID, v.index])
        );
        // Add the previous index to the new ordered list we'll display visually.
        // That is, we're updating the list to be the most updated list of elements but with the previous index
        // that's currently being displayed. We use this information to decide how to animate the element.
        return latestOrdered.current.map((latestValue) => ({
          ...latestValue,
          prevIndex: prevSymbols.get(latestValue.marketID),
          runInitialAnimation: false,
        }));
      });
    }, ANIMATION_DEBOUNCE_TIME);

    return () => clearInterval(interval);
  }, []);

  // Handle subscribing/unsubscribing to/from all state events across all markets on component mount/unmount.
  useEffect(() => {
    subscribe.state(null);

    return () => unsubscribe.state(null);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <>
      <motion.div className="relative w-full h-full">
        <StyledGrid>
          <GridRowBorders>
            {/* To prevent auto-scrolling to the top of the page when the elements re-order, we provide
             a static grid of horizontal lines that are the same height as the emoji grid items. */}
            {Array.from({ length: ordered.length }).map((_, i) => (
              <div
                key={`${i}-live-clone-for-grid-lines`}
                className={"horizontal-grid-line"}
                style={{
                  width: EMOJI_GRID_ITEM_WIDTH,
                  height: EMOJI_GRID_ITEM_HEIGHT,
                }}
              />
            ))}
          </GridRowBorders>
          {ordered.map((v) => {
            return (
              <TableCard
                key={`live-${v.key}`}
                index={v.index}
                pageOffset={0}
                marketID={v.marketID}
                symbol={v.symbol}
                emojis={v.emojis}
                staticNumSwaps={v.staticNumSwaps}
                staticMarketCap={v.staticMarketCap}
                staticVolume24H={v.staticVolume24H}
                itemsPerLine={itemsPerLine}
                prevIndex={v.prevIndex}
                runInitialAnimation={v.runInitialAnimation}
                animateLayout={true}
              />
            );
          })}
        </StyledGrid>
      </motion.div>
    </>
  );
};
