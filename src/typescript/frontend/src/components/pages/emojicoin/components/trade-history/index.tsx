import React from "react";

import { translationFunction } from "context/language-context";
import { useElementDimensions } from "hooks";
import { getEmptyListTr } from "utils";

import { TableRowDesktop } from "./components";
import { Table, Text, Th, ThInner, HeaderTr, TBody, EmptyTr } from "components";
import { StyledTradeHistory } from "./styled";

import { HEADERS } from "./constants";
import { type TradeHistoryProps } from "../../types";
import { toDecimalsAPT } from "lib/utils/decimals";
import { rankFromAPTAmount } from "lib/utils/rank";

const TradeHistory = (props: TradeHistoryProps) => {
  const { t } = translationFunction();
  const { offsetHeight: tradeHistoryTableBodyHeight } = useElementDimensions("tradeHistoryTableBody");

  const data = props.data.swaps.map(v => ({
    ...rankFromAPTAmount(Number(toDecimalsAPT(v.quoteVolume, 3))),
    apt: v.quoteVolume.toString(),
    emoji: v.baseVolume.toString(),
    type: v.isSell ? "sell" : "buy",
    price: v.avgExecutionPrice.toString(),
    date: new Date(Number(v.time / 1000n)),
    version: v.version, // TODO: Pass tx hash down the component tree.
  }));

  return (
    <StyledTradeHistory>
      <Table minWidth="700px">
        <thead>
          <HeaderTr>
            {HEADERS.map((th, index) => (
              <Th width={th.width} minWidth="100px" key={index}>
                <ThInner>
                  <Text textScale="bodyLarge" textTransform="uppercase" color="econiaBlue" $fontWeight="regular">
                    {t(th.text)}
                  </Text>
                </ThInner>
              </Th>
            ))}
          </HeaderTr>
        </thead>
        <TBody height={{ _: "272px", tablet: "340px" }} id="tradeHistoryTableBody">
          {data.map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
          {getEmptyListTr(tradeHistoryTableBodyHeight, data.length, EmptyTr)}
        </TBody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
