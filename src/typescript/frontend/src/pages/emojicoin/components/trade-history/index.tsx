import React from "react";

import { useTranslation } from "context";
import { HEADERS, DATA } from "./constants";
import { TableRowDesktop } from "./components";
import { Table, Text, Th } from "components";

import { StyledTradeHistory } from "./styled";

const TradeHistory: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StyledTradeHistory>
      <Table>
        <thead>
          <tr>
            {HEADERS.map((th, index) => (
              <Th width={th.width} key={index}>
                <Text textScale="bodyLarge" textTransform="uppercase" color="econiaBlue" $fontWeight="regular">
                  {t(th.text)}
                </Text>
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...DATA, ...DATA, ...DATA, ...DATA, ...DATA].map((item, index) => (
            <TableRowDesktop key={index} item={item} />
          ))}
        </tbody>
      </Table>
    </StyledTradeHistory>
  );
};

export default TradeHistory;
