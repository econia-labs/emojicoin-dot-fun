import React, { type PropsWithChildren, useEffect, useMemo, useRef } from "react";

import { type TradeHistoryProps } from "../../types";
import { getRankFromEvent } from "lib/utils/get-user-rank";
import { useEventStore, useNameStore, useWebSocketClient } from "context/state-store-context";
import { type Types } from "@sdk/types/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import TableRow from "./table-row";
import { type TableRowDesktopProps } from "./table-row/types";
import { memoizedSortedDedupedEvents, mergeSortedEvents, sortEvents } from "lib/utils/sort-events";
import { parseJSON } from "utils";
import { motion } from "framer-motion";
import "./trade-history.css";

const HARD_LIMIT = 500;

const toTableItem = (value: Types.SwapEvent): TableRowDesktopProps["item"] => ({
  ...getRankFromEvent(value),
  apt: value.quoteVolume.toString(),
  emoji: value.baseVolume.toString(),
  date: new Date(Number(value.time / 1000n)),
  type: value.isSell ? "sell" : "buy",
  price: value.avgExecutionPriceQ64.toString(),
  swapper: value.swapper,
  version: value.version,
});

const TableHeader =
  "font-forma body-lg font-normal text-ec-blue position-sticky bg-black z-1 uppercase " +
  "text-center mt-[2px]";

const ThWrapper = ({ className, children }: { className: string } & PropsWithChildren) => (
  <th className={className + " " + TableHeader}>{children}</th>
);

const getCombinedSwaps = (swaps: readonly Types.SwapEvent[], marketID: bigint) => {
  const stateGuids = new Set(swaps.map((swap) => swap.guid));
  const localSwaps: Types.SwapEvent[] = parseJSON(localStorage.getItem(`swaps`) ?? "[]");
  const filteredSwaps = localSwaps.filter(
    (swap: Types.SwapEvent) => swap.marketID === marketID && !stateGuids.has(swap.guid)
  );
  sortEvents(filteredSwaps);
  return mergeSortedEvents(swaps, filteredSwaps);
};

const TradeHistory = (props: TradeHistoryProps) => {
  const marketID = props.data.marketID;

  const swaps = getCombinedSwaps(
    useEventStore((s) => s.getMarket(marketID)?.swapEvents ?? []),
    BigInt(marketID)
  );

  const subscribe = useWebSocketClient((s) => s.subscribe);
  const requestUnsubscribe = useWebSocketClient((s) => s.requestUnsubscribe);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.swap(marketID, null);
    return () => requestUnsubscribe.swap(marketID, null);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const initialLoad = useRef(true);
  useEffect(() => {
    initialLoad.current = false;
  }, []);

  // TODO: Add infinite scroll to this.
  // For now just don't render more than `HARD_LIMIT` chats.
  const sortedSwaps = useMemo(
    () =>
      memoizedSortedDedupedEvents({
        a: props.data.swaps,
        b: swaps,
        order: "desc",
        limit: HARD_LIMIT,
        canAnimateAsInsertion: !initialLoad.current,
      }),
    /* eslint-disable react-hooks/exhaustive-deps */
    [props.data.swaps.length, swaps.length]
  );

  const addresses = sortedSwaps.map((swap) => swap.swapper);
  const nameResolver = useNameStore((s) => s.getResolverWithNames(addresses));

  const sortedSwapsWithNames = useMemo(() => {
    const data = sortedSwaps.map((e) => ({
      ...e,
      swapper: nameResolver(e.swapper),
    }));
    return data;
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [nameResolver]);

  return (
    <table className="relative flex flex-col table-fixed w-full">
      <thead className="relative w-full border-solid border-b-[1px] border-b-dark-gray">
        <tr className={"flex w-full h-[33px]" + (sortedSwaps.length < 11 ? "" : " pr-[9px] ")}>
          <ThWrapper className="flex min-w-[50px] ml-[10px] xl:ml-[21px]">
            <span className="flex my-auto">Rank</span>
          </ThWrapper>
          <ThWrapper className="flex w-[5%]" />
          <ThWrapper className="flex w-[22%] md:w-[18%]">
            <span className="flex my-auto">APT</span>
          </ThWrapper>
          <ThWrapper className="flex w-[22%] md:w-[18%]">
            <span className="flex my-auto">
              {symbolBytesToEmojis(props.data.emojiBytes).symbol}
            </span>
          </ThWrapper>
          <ThWrapper className="hidden md:flex md:w-[24%]">
            <span className="flex my-auto">Time</span>
          </ThWrapper>
          <ThWrapper className="flex w-[22%] md:w-[18%]">
            <span className="flex my-auto">Price</span>
          </ThWrapper>
          <ThWrapper className="flex w-[22%] md:w-[18%]">
            <span className="ml-auto my-auto mr-[20px]">Sender</span>
          </ThWrapper>
        </tr>
      </thead>
      <motion.tbody
        layoutScroll
        className="flex flex-col overflow-auto scrollbar-track w-full h-[340px] overflow-x-hidden"
      >
        {sortedSwapsWithNames.map((item, index) => (
          <TableRow
            // Note the key/index must be in reverse for the rows to animate correctly.
            key={sortedSwaps.length - index}
            index={sortedSwaps.length - index}
            item={toTableItem(item)}
            showBorder={index !== sortedSwaps.length - 1 || sortedSwaps.length < 11}
            numSwapsDisplayed={sortedSwaps.length}
            shouldAnimateAsInsertion={item.shouldAnimateAsInsertion}
          ></TableRow>
        ))}
        <tr className="absolute top-0 right-0 w-full z-[-1]">
          {Array.from({ length: 11 }).map((_, index) => (
            <motion.td
              key={`EMPTY_ROW::${index}`}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: sortedSwaps.length + 1 > index ? 0 : 1,
                transition: {
                  type: "just",
                  // Pretty much just guessing here with the `- 5` on the delay.
                  // We could coordinate it better with animation controls that are triggered as soon as the last row
                  // from the populated trades finishes animating but this is good enough.
                  delay: (index + sortedSwaps.length - 5) * 0.02,
                },
              }}
              className="flex min-h-[33px] border-b-dark-gray border-solid border-[1px] w-full"
            />
          ))}
        </tr>
      </motion.tbody>
    </table>
  );
};

export default TradeHistory;
