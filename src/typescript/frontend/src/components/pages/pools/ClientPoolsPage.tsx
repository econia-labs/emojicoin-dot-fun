"use client";

import React, { useEffect, useState } from "react";

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
import { isDisallowedEventKey, parseJSON } from "utils";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";

export const ClientPoolsPage = () => {
  const [sortBy, setSortBy] = useState<SortByPageQueryParams>("all_time_vol");
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [page, setPage] = useState<number>(1);
  const [markets, setMarkets] = useState<any[]>([]);
  const [allDataIsLoaded, setAllDataIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if(page === 1) {
      fetch(`/pools/api?sortby=${sortBy}&orderby=${orderBy}&page=${page}`)
        .then((res) => res.text())
        .then((txt) => parseJSON(txt))
        .then((data) => {
          if(data.markets.length < MARKETS_PER_PAGE) {
            setAllDataIsLoaded(true);
          }
          setMarkets([...data.markets]);
        });
    } else {
      fetch(`/pools/api?sortby=${sortBy}&orderby=${orderBy}&page=${page}`)
        .then((res) => res.text())
        .then((txt) => parseJSON(txt))
        .then((data) => {
          if(data.markets.length < MARKETS_PER_PAGE) {
            setAllDataIsLoaded(true);
          }
          setMarkets([...markets, ...data.markets]);
        });
    }
  }, [page, orderBy, sortBy]);

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
            maxWidth={{ _: "800px", laptopL: "57%" }}
            alignItems="center"
            gap="13px"
          >
            <TableHeaderSwitcher title1="Pools" title2="My pools" />

            <TableHeaderSwitcher title1="Top 20" title2="All" />

            {!isMobile ? (
              <>
                <InputGroup
                  textScale="pixelHeading3"
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
          <PoolsTable
            data={markets}
            sortBy={(s) => {
              setSortBy(s);
              setPage(1);
              setAllDataIsLoaded(false);
            }}
            orderBy={(s) => {
              setOrderBy(s);
              setPage(1);
              setAllDataIsLoaded(false);
            }}
            onSelect={(index) => {
              setSelectedIndex(index);
            }}
            onEnd={() => {
              if(!allDataIsLoaded) {
                setPage(page + 1);
              }
            }}
          />
        </StyledInner>

        <StyledInner flexGrow={1} width={{ _: "100%", laptopL: "43%" }}>
          <Liquidity market={selectedIndex !== undefined ? markets[selectedIndex] : undefined} />
        </StyledInner>
      </StyledWrapper>
    </StyledPoolsPage>
  );
};

export default ClientPoolsPage;
