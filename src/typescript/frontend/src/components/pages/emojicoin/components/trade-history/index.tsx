import React from "react";

import { useTranslation } from "context";
import { useElementDimensions } from "hooks";
import { getEmptyListTr } from "utils";

import { TableRowDesktop } from "./components";
import { Table, Text, Th, ThInner, HeaderTr, TBody, EmptyTr } from "components";
import { StyledTradeHistory } from "./styled";

import { HEADERS, DATA } from "./constants";

const TradeHistory: React.FC = () => {
  const { t } = useTranslation();
  const { offsetHeight: tradeHistoryTableBodyHeight } = useElementDimensions("tradeHistoryTableBody");

  const data = [...DATA, ...DATA, ...DATA, ...DATA, ...DATA];
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
        <TBody height="309px" id="tradeHistoryTableBody">
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
