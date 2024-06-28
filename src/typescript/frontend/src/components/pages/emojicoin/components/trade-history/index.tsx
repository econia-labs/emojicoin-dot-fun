import React, { useEffect } from "react";

import { translationFunction } from "context/language-context";
import { useElementDimensions } from "hooks";
import { getEmptyListTr } from "utils";

import { TableRowDesktop } from "./components";
import { Table, Text, Th, ThInner, HeaderTr, TBody, EmptyTr } from "components";
import { StyledTradeHistory } from "./styled";

import { getHeaders } from "./misc";
import { type TradeHistoryProps } from "../../types";
import { toCoinDecimalString } from "lib/utils/decimals";
import { getRankFromSwapEvent } from "lib/utils/get-user-rank";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { type TableRowDesktopProps } from "./components/table-row-desktop/types";
import { type Types } from "@sdk/types/types";
import "./scrollbar.css";
import { symbolBytesToEmojis } from "@sdk/emoji_data";

const toTableItem = (value: Types.SwapEvent): TableRowDesktopProps["item"] => ({
  ...getRankFromSwapEvent(Number(toCoinDecimalString(value.quoteVolume, 3))),
  apt: value.quoteVolume.toString(),
  emoji: value.baseVolume.toString(),
  date: new Date(Number(value.time / 1000n)),
  type: value.isSell ? "sell" : "buy",
  price: value.avgExecutionPrice.toString(),
  version: value.version,
});

const TableHeader =
  "text-ec-blue position-sticky top-0 bg-black z-1 uppercase " +
  "border border-solid border-b-dark-gray min-w-[100px] text-left body-lg";

const TableBody =
  "" +
  "";



const TradeHistory = (props: TradeHistoryProps) => {
  const { t } = translationFunction();
  const { offsetHeight: tradeHistoryTableBodyHeight } =
    useElementDimensions("tradeHistoryTableBody");
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
    <div className="w-full h-full overflow-x-auto scrollbar-track">
      <div className="table-fixed max-w-full w-full min-w-[700px]">
        <thead>
          <tr className="flex">
            <th className={`w-1/6 ${TableHeader}`}>Rank</th>
            <th className={`w-1/6 ${TableHeader}`}>APT</th>
            <th className={`w-1/6 ${TableHeader}`}>
              {symbolBytesToEmojis(props.data.emojiBytes).symbol}
            </th>
            <th className={`w-1/6 ${TableHeader}`}>Type</th>
            <th className={`w-1/6 ${TableHeader}`}>Date</th>
            <th className={`w-1/6 ${TableHeader}`}>Price</th>
            <th className={`w-1/6 ${TableHeader}`}>Transaction</th>
          </tr>
        </thead>
        <tbody className="flex flex-col overflow-auto w-full scrollbar-track">

        </tbody>
      </div>
    </div>
    // <StyledTradeHistory>
    //   <Table minWidth="700px">
    //     <thead>
    //       <HeaderTr>
    //         {getHeaders(props.data.symbol).map((th, index) => (
    //           <Th width={th.width} minWidth="100px" key={index}>
    //             <ThInner>
    //               <Text
    //                 textScale="bodyLarge"
    //                 textTransform="uppercase"
    //                 color="econiaBlue"
    //                 $fontWeight="regular"
    //               >
    //                 {t(th.text)}
    //               </Text>
    //             </ThInner>
    //           </Th>
    //         ))}
    //       </HeaderTr>
    //     </thead>
    //     <TBody height={{ _: "272px", tablet: "340px" }} id="tradeHistoryTableBody">
    //       {swaps.map((item, index) => (
    //         <TableRowDesktop key={index} item={toTableItem(item)} />
    //       ))}
    //       {getEmptyListTr(tradeHistoryTableBodyHeight, swaps.length, EmptyTr)}
    //     </TBody>
    //   </Table>
    // </StyledTradeHistory>
  );
};

export default TradeHistory;
