"use client";

import React, { useEffect, useState } from "react";

import { useMatchBreakpoints } from "hooks";

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
import { useAptos } from "context/wallet-context/AptosContextProvider";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";

export const ClientPoolsPage = () => {
  const [sortBy, setSortBy] = useState<SortByPageQueryParams>("all_time_vol");
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [page, setPage] = useState<number>(1);
  const [markets, setMarkets] = useState<FetchSortedMarketDataReturn["markets"]>([]);
  const [allDataIsLoaded, setAllDataIsLoaded] = useState<boolean>(false);
  const [pools, setPools] = useState<"all" | "mypools">("all");

  const { account } = useAptos();

  useEffect(() => {
    const root = "/pools/api";
    const sortByQuery = `sortby=${sortBy}`;
    const orderByQuery = `orderby=${orderBy}`;
    const pageQuery = `page=${page}`;
    const accountQuery = pools === "mypools" ? `&account=${account?.address}` : "";
    fetch(`${root}?${sortByQuery}&${orderByQuery}&${pageQuery}${accountQuery}`)
      .then((res) => res.text())
      .then((txt) => parseJSON(txt))
      .then((data) => {
        if (data.markets.length < MARKETS_PER_PAGE) {
          setAllDataIsLoaded(true);
        }
        setMarkets((markets) => (page === 1 ? [...data.markets] : [...markets, ...data.markets]));
      });
  }, [page, orderBy, sortBy, account, pools]);

  const { isMobile } = useMatchBreakpoints();

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
            <TableHeaderSwitcher
              title1="Pools"
              title2="My pools"
              onSelect={(title) => {
                if (title === "Pools" && pools !== "all") {
                  setPools("all");
                } else if (title === "My pools" && pools !== "mypools") {
                  setPools("mypools");
                }
              }}
            />

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
                  <Input id="searchPool" onKeyDown={onInputChange} />
                </InputGroup>
                {"TODO"}
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
              <Input id="searchPool" onKeyDown={onInputChange} />
            </InputGroup>
            {"TODO"}
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
              if (!allDataIsLoaded) {
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
