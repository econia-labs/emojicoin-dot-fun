import React from "react";

import { useTranslation } from "context";
import { HEADERS, DATA } from "./constants";
import { TableRowDesktop } from "./components";

import { Table, Th, TBody, THead, StyledTradeHistory } from "./styled";

const TradeHistory: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StyledTradeHistory>
      <Table>
        <THead>
          <tr>
            {HEADERS.map((th, index) => (
              <Th width={th.width} key={index}>
                {t(th.text)}
              </Th>
            ))}
          </tr>
        </THead>
        <TBody>
          {[...DATA, ...DATA, ...DATA, ...DATA, ...DATA].map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
        </TBody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
