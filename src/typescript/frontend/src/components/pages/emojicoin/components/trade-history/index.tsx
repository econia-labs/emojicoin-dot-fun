import React, { type PropsWithChildren, useEffect } from "react";

import { type TradeHistoryProps } from "../../types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { getRankFromSwapEvent } from "lib/utils/get-user-rank";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { type Types } from "@sdk/types/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import TableRow from "./table-row";
import { type TableRowDesktopProps } from "./table-row/types";
import "./trade-history.css";

const toTableItem = (value: Types.SwapEvent): TableRowDesktopProps["item"] => ({
  ...getRankFromSwapEvent(Number(toCoinDecimalString(value.quoteVolume, 3))),
  apt: value.quoteVolume.toString(),
  emoji: value.baseVolume.toString(),
  date: new Date(Number(value.time / 1000n)),
  type: value.isSell ? "sell" : "buy",
  price: value.avgExecutionPrice.toString(),
  swapper: value.swapper,
  version: value.version,
});

const TableHeader =
  "font-forma body-lg font-normal text-ec-blue position-sticky bg-black z-1 uppercase " +
  "text-center mt-[2px]";

const ThWrapper = ({ className, children }: { className: string } & PropsWithChildren) => (
  <th className={className + " " + TableHeader}>{children}</th>
);

const TradeHistory = (props: TradeHistoryProps) => {
  const marketID = props.data.marketID;

  const swaps = useEventStore((s) => {
    const market = s.getMarket(marketID.toString());
    return market ? market.swapEvents : [];
  });
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    subscribe.swap(marketID, null);
    return () => unsubscribe.swap(marketID, null);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <table className="flex flex-col table-fixed w-full">
      <thead className="relative w-full border-solid border-b-[1px] border-b-dark-gray">
        <tr className={"flex w-full h-[33px]" + (swaps.length < 11 ? "" : " pr-[9px] ")}>
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
      <tbody className="flex flex-col overflow-auto scrollbar-track w-full h-[340px]">
        {swaps.map((item, index) => (
          <TableRow
            key={index}
            item={toTableItem(item)}
            showBorder={index !== swaps.length - 1 || swaps.length < 11}
          ></TableRow>
        ))}
        {Array.from({ length: 10 - swaps.length }).map((_, index) => (
          <tr
            key={`EMPTY_ROW::${index}`}
            className="flex min-h-[33px] border-b-dark-gray border-solid border-[1px]"
          />
        ))}
      </tbody>
    </table>
  );
};

export default TradeHistory;
