import React from "react";

import { useTranslation } from "context";

import { TableRowDesktop } from "./components";
import { Table, Text, Th, ThInner, HeaderTr, TBody } from "components";
import { StyledTradeHistory } from "./styled";

import { HEADERS, DATA } from "./constants";

const TradeHistory: React.FC = () => {
  const { t } = useTranslation();

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
        <TBody height="309px">
          {[...DATA, ...DATA, ...DATA, ...DATA, ...DATA].map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
        </TBody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
