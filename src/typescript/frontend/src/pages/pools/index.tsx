import React from "react";

import { Flex, Input, InputGroup } from "components";
import { Liquidity, PoolsTable, TableHeaderSwitcher } from "./components";
import { StyledWrapper, StyledHeader, StyledHeaderInner, StyledPoolsPage, StyledInner } from "./styled";

const PoolsPage: React.FC = () => {
  return (
    <StyledPoolsPage>
      <StyledHeader>
        <StyledHeaderInner>
          <Flex justifyContent="space-between" width="100%" maxWidth="57%" alignItems="center">
            <TableHeaderSwitcher title1="Pools" title2="My pools" />

            <TableHeaderSwitcher title1="Top 20" title2="All" />

            <InputGroup
              textScale="pixelHeading3"
              variant="fantom"
              width="unset"
              isShowError={false}
              label="Search pool:"
              forId="searchPool"
            >
              <Input id="searchPool" />
            </InputGroup>
          </Flex>
        </StyledHeaderInner>
      </StyledHeader>

      <StyledWrapper>
        <StyledInner width="57%">
          <PoolsTable />
        </StyledInner>

        <StyledInner width="43%">
          <Liquidity />
        </StyledInner>
      </StyledWrapper>
    </StyledPoolsPage>
  );
};

export default PoolsPage;
