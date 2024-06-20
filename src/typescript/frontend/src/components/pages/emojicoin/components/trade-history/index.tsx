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
import { rankFromAPTAmount } from "lib/utils/rank";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { type TableRowDesktopProps } from "./components/table-row-desktop/types";
import { type Types } from "@sdk/types/types";

const toTableItem = (value: Types.SwapEvent): TableRowDesktopProps["item"] => ({
  ...rankFromAPTAmount(Number(toCoinDecimalString(value.quoteVolume, 3))),
  apt: value.quoteVolume.toString(),
  emoji: value.baseVolume.toString(),
  date: new Date(Number(value.time / 1000n)),
  type: value.isSell ? "sell" : "buy",
  price: value.avgExecutionPrice.toString(),
  version: value.version,
});

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
    <StyledTradeHistory>
      <Table minWidth="700px">
        <thead>
          <HeaderTr>
            {getHeaders(props.data.symbol).map((th, index) => (
              <Th width={th.width} minWidth="100px" key={index}>
                <ThInner>
                  <Text
                    textScale="bodyLarge"
                    textTransform="uppercase"
                    color="econiaBlue"
                    $fontWeight="regular"
                  >
                    {t(th.text)}
                  </Text>
                </ThInner>
              </Th>
            ))}
          </HeaderTr>
        </thead>
        <TBody height={{ _: "272px", tablet: "340px" }} id="tradeHistoryTableBody">
          {swaps.map((item, index) => (
            <TableRowDesktop key={index} item={toTableItem(item)} />
          ))}
          {getEmptyListTr(tradeHistoryTableBodyHeight, swaps.length, EmptyTr)}
        </TBody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
