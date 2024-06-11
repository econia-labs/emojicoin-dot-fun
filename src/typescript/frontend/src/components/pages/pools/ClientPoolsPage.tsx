"use client";

import React from "react";

import { useEmojicoinPicker, useMatchBreakpoints } from "hooks";

import { FlexGap } from "@containers";
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
import { isDisallowedEventKey } from "utils";

export const ClientPoolsPage = () => {
  const { isMobile } = useMatchBreakpoints();

  // TODO: Initialize market state data here (and any other data that goes in the event store).

  const { targetRef, tooltip } = useEmojicoinPicker({
    onEmojiClick: () => {},
    placement: "bottom",
    width: 272,
  });

  const onInputChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisallowedEventKey(e)) {
      e.preventDefault();
    }
  };

  return (
    <StyledPoolsPage>
      <StyledHeader>
        <StyledHeaderInner>
          <FlexGap
            justifyContent={{ _: "unset", tablet: "space-between" }}
            width="100%"
            maxWidth={{ _: "650px", laptopL: "57%" }}
            alignItems="center"
            gap="13px"
          >
            <TableHeaderSwitcher title1="Pools" title2="My pools" />

            <TableHeaderSwitcher title1="Top 20" title2="All" />

            {!isMobile ? (
              <>
                <InputGroup
                  textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
                  variant="fantom"
                  width="unset"
                  isShowError={false}
                  label="Search pool:"
                  forId="searchPool"
                >
                  <Input id="searchPool" onKeyDown={onInputChange} ref={targetRef} />
                </InputGroup>
                {tooltip}
              </>
            ) : null}
          </FlexGap>
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
              label="Search:"
              forId="searchPool"
            >
              <Input id="searchPool" onKeyDown={onInputChange} ref={targetRef} />
            </InputGroup>
            {tooltip}
          </StyledHeaderInner>
        </StyledSubHeader>
      ) : null}

      <StyledWrapper>
        <StyledInner width={{ _: "100%", laptopL: "57%" }}>
          <PoolsTable />
        </StyledInner>

        <StyledInner flexGrow={1} width={{ _: "100%", laptopL: "43%" }}>
          <Liquidity />
        </StyledInner>
      </StyledWrapper>
    </StyledPoolsPage>
  );
};

export default ClientPoolsPage;
