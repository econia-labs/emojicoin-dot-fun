"use client";

import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Flex } from "@/containers";
import { Input } from "components/inputs/input";
import { InputGroup } from "components/inputs/input-group";
import { Liquidity, PoolsTable, TableHeaderSwitcher } from "components/pages/pools/components";
import {
  StyledWrapper,
  StyledHeader,
  StyledHeaderInner,
  StyledPoolsPage,
  StyledInner,
  StyledSubHeader,
} from "components/pages/pools/styled";

export const Pools = () => {
  const { isMobile } = useMatchBreakpoints();

  return (
    <StyledPoolsPage>
      <StyledHeader>
        <StyledHeaderInner>
          <Flex
            justifyContent="space-between"
            width="100%"
            maxWidth={{ _: "650px", laptopL: "57%" }}
            alignItems="center"
          >
            <TableHeaderSwitcher title1="Pools" title2="My pools" />

            <TableHeaderSwitcher title1="Top 20" title2="All" />

            {!isMobile ? (
              <InputGroup
                textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
                variant="fantom"
                width="unset"
                isShowError={false}
                label="Search pool:"
                forId="searchPool"
              >
                <Input id="searchPool" />
              </InputGroup>
            ) : null}
          </Flex>
        </StyledHeaderInner>
      </StyledHeader>
      {isMobile ? (
        <StyledSubHeader>
          <StyledHeaderInner>
            <InputGroup
              textScale="pixelHeading4"
              variant="fantom"
              width="unset"
              isShowError={false}
              label="Search pool:"
              forId="searchPool"
            >
              <Input id="searchPool" />
            </InputGroup>
          </StyledHeaderInner>
        </StyledSubHeader>
      ) : null}

      <StyledWrapper>
        <StyledInner width={{ _: "100%", laptopL: "57%" }}>
          <PoolsTable />
        </StyledInner>

        <StyledInner width={{ _: "100%", laptopL: "43%" }}>
          <Liquidity />
        </StyledInner>
      </StyledWrapper>
    </StyledPoolsPage>
  );
};

export default Pools;
