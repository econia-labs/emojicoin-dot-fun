"use client";

import { useEffect, useInsertionEffect, useMemo, useRef, useState } from "react";
import TableCard from "../table-card/TableCard";
import { GRID_PADDING, GridRowBorders, StyledGrid } from "./styled";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { EMOJI_GRID_ITEM_HEIGHT, EMOJI_GRID_ITEM_WIDTH } from "../const";
import { motion } from "framer-motion";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { constructOrdered, type WithTimeIndexAndPrev } from "./utils";
import { useWindowSize } from "react-use";
import { useEmojiPicker } from "context/emoji-picker-context";
import useEvent from "@hooks/use-event";
import { TOTAL_ANIMATION_TIME } from "../table-card/animation-variants";
import "./module.css";

export const ANIMATION_DEBOUNCE_TIME = TOTAL_ANIMATION_TIME;
export const MAX_ELEMENTS_PER_LINE = 7;

const toSerializedGridOrder = <T extends { marketID: number }>(data: T[]) =>
  data.map((v) => v.marketID).join(",");

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
  // Note we merely use this as a trigger, we can use the latestOrdered ref to get the true latest ordered list,
  // although they should be roughly the same at comparison since the only time we actually check the value of gridOrder
  // is right when we should update the ordered list.
  const [gridOrder, setGridOrder] = useState(toSerializedGridOrder(latestOrdered.current));
  const [ordered, setOrdered] = useState<
    Array<WithTimeIndexAndPrev & { runInitialAnimation?: boolean }>
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

  const { width } = useWindowSize();
  const itemsPerLine = useMemo(() => {
    const num = Math.floor((width - GRID_PADDING * 2) / EMOJI_GRID_ITEM_WIDTH);
    return Math.min(num, MAX_ELEMENTS_PER_LINE);
  }, [width]);

  // Note that this must be a stable function that's not in any effect's dependency array, otherwise
  // it'd trigger a re-render and thus an infinite loop. We use `useEvent` for this.
  const updateGridIfOrderChanged = useEvent(() => {
    const latestGrid = toSerializedGridOrder(latestOrdered.current);
    // We only update the grid if the grid order has changed. This is what triggers the useEffect that clears
    // any timeouts and intervals and restarts them.
    if (latestGrid === gridOrder) {
      setGridOrder(latestGrid);
    }
  });

  // Construct `latestOrdered` as a ref. Every time any incoming data changes, we update the latestOrdered ref
  // so that anywhere in the component we always see the latest ordered list.
  // We also update the grid if the order has changed.
  useInsertionEffect(() => {
    latestOrdered.current = constructOrdered({
      data,
      stateFirehose,
      getMarket,
      getSearchEmojis,
    });
    updateGridIfOrderChanged();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data, stateFirehose, getMarket, getSearchEmojis]);

  const lastAnimationUpdate = useRef<number>(Date.now());

  const updateOrdered = useEvent(() => {
    setOrdered((previousOrdered) => {
      // Return the same exact object in state if the grid order hasn't changed.
      if (gridOrder === toSerializedGridOrder(previousOrdered)) {
        return previousOrdered;
      }
      // Update the last animation update time.
      lastAnimationUpdate.current = Date.now();
      // Map the previous ordered list's symbols to its index.
      const prevSymbols = new Map<number, number>(
        previousOrdered.map((v) => [v.marketID, v.index])
      );
      // Add the previous index to the new ordered list we'll display visually.
      return latestOrdered.current.map((latestValue) => ({
        ...latestValue,
        prevIndex: prevSymbols.get(latestValue.marketID),
        runInitialAnimation: false,
      }));
    });
  });

  // Update the ordered list on an interval to ensure that the list is always up-to-date, but also to
  // make sure that we don't interrupt the animation as well.
  // Note that I've ensured that multiple changes during both the timeout and interval delay will not cause
  // a re-render/update if the grid order hasn't changed. This means we *always* get a visual update if the grid
  // order has changed and we're not in the middle of an animation.
  useEffect(() => {
    // We always calculate the interval remainder because this is triggered every time the grid order changes, and we
    // want to check how long we need to wait since the last update to update the current ordered list visually.
    // Seconds since last animation: (Date.now() - lastAnimationUpdate.current) * 0.001
    // We must wait: Math.max(0, updateDelay * 0.001) seconds.
    const intervalRemainder = ANIMATION_DEBOUNCE_TIME - (Date.now() - lastAnimationUpdate.current);
    const updateDelay = Math.max(0, intervalRemainder);

    let interval: number;
    const timeout = window.setTimeout(() => {
      updateOrdered();

      interval = window.setInterval(() => {
        updateOrdered();
      }, ANIMATION_DEBOUNCE_TIME);
    }, updateDelay);

    return () => {
      clearTimeout(timeout);
      if (typeof interval === "number") {
        clearInterval(interval);
      }
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [gridOrder]);

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
