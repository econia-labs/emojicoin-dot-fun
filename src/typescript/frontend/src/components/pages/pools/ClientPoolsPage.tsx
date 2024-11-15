"use client";

import React, { useEffect, useState } from "react";
import { useMatchBreakpoints } from "hooks";
import { FlexGap } from "@containers";
import { Liquidity, PoolsTable, TableHeaderSwitcher } from "components/pages/pools/components";
import {
  StyledWrapper,
  StyledHeader,
  StyledHeaderInner,
  StyledPoolsPage,
  StyledInner,
  StyledSubHeader,
} from "components/pages/pools/styled";
import { parseJSON } from "utils";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEmojiPicker } from "context/emoji-picker-context";
import { useSearchParams } from "next/navigation";
import { encodeEmojis, getEmojisInString, type SymbolEmoji } from "@sdk/emoji_data";
import SearchBar from "components/inputs/search-bar";
import { type MarketStateModel, type UserPoolsRPCModel } from "@sdk/indexer-v2/types";

export type PoolsData = MarketStateModel | UserPoolsRPCModel;

export const ClientPoolsPage = ({ initialData }: { initialData: PoolsData[] }) => {
  const searchParams = useSearchParams();
  const poolParam = searchParams.get("pool");
  const [sortBy, setSortBy] = useState<SortByPageQueryParams>("all_time_vol");
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(poolParam ? 0 : undefined);
  const [page, setPage] = useState<number>(1);
  const [markets, setMarkets] = useState<PoolsData[]>(initialData);
  const [allDataIsLoaded, setAllDataIsLoaded] = useState<boolean>(false);
  const [pools, setPools] = useState<"all" | "mypools">("all");
  const [realEmojis, setRealEmojis] = useState(getEmojisInString(poolParam ?? ""));
  const { emojis, setEmojis } = useEmojiPicker((state) => ({
    emojis: state.emojis,
    setEmojis: state.setEmojis,
  }));
  useEffect(() => {
    setEmojis(realEmojis);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const { account } = useAptos();

  useEffect(() => {
    setRealEmojis(emojis as SymbolEmoji[]);
  }, [emojis]);

  useEffect(() => {
    const poolsAPI = "/pools/api";
    const params = new URLSearchParams({
      sortby: sortBy,
      orderby: orderBy,
      page: page.toString(),
    });
    if (pools === "mypools" && account?.address) {
      params.set("account", account.address);
    }
    if (realEmojis.length) {
      params.set("searchBytes", encodeEmojis(realEmojis));
    }
    const url = `${poolsAPI}?${params.toString()}`;
    fetch(url)
      .then((res) => res.text())
      .then((txt) => parseJSON(txt) as PoolsData[])
      .then((data) => {
        if (data.length < MARKETS_PER_PAGE) {
          setAllDataIsLoaded(true);
        }
        setMarkets((markets) => (page === 1 ? [...data] : [...markets, ...data]));
      });
  }, [page, orderBy, sortBy, account, pools, realEmojis]);

  const { isMobile } = useMatchBreakpoints();

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
            {!isMobile ? <SearchBar /> : null}

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
          </FlexGap>
        </StyledHeaderInner>
      </StyledHeader>
      {isMobile ? (
        <StyledSubHeader>
          <StyledHeaderInner>
            <SearchBar />
          </StyledHeaderInner>
        </StyledSubHeader>
      ) : null}

      <StyledWrapper>
        <StyledInner width={{ _: "100%", laptopL: "57%" }}>
          <PoolsTable
            index={selectedIndex}
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
