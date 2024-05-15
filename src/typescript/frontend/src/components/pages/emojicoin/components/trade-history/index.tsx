import React from "react";

import { useTranslation } from "context";

import { Flex } from "@/containers";
import { TableRowDesktop } from "./components";
import { Table, Text, Th, ThInner, HeaderTr, TBody, TrWrapper } from "components";
import { StyledTradeHistory } from "./styled";

import { HEADERS, DATA } from "./constants";

const TradeHistory: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StyledTradeHistory>
      <Table>
        <thead>
          <HeaderTr>
            <Flex width="100%">
              {HEADERS.map((th, index) => (
                <Th width={th.width} key={index}>
                  <ThInner>
                    <Text textScale="bodyLarge" textTransform="uppercase" color="econiaBlue" $fontWeight="regular">
                      {t(th.text)}
                    </Text>
                  </ThInner>
                </Th>
              ))}
            </Flex>
          </HeaderTr>
        </thead>
        <TBody height="309px">
          {[...DATA, ...DATA, ...DATA, ...DATA, ...DATA].map((item, index) => (
            <TrWrapper key={index}>
              <TableRowDesktop item={item} />
            </TrWrapper>
          ))}
        </TBody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
