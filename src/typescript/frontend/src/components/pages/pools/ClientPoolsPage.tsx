"use client";

import type { PoolsData } from "app/pools/page";
import SearchBar from "components/inputs/search-bar";
import { Liquidity, PoolsTable, TableHeaderSwitcher } from "components/pages/pools/components";
import {
  StyledHeader,
  StyledHeaderInner,
  StyledInner,
  StyledPoolsPage,
  StyledSubHeader,
  StyledWrapper,
} from "components/pages/pools/styled";
import { useEmojiPicker } from "context/emoji-picker-context";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import type { SortByPageQueryParams } from "lib/queries/sorting/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FlexGap } from "@/containers";
import { useAccountAddress } from "@/hooks/use-account-address";
import { encodeEmojis, getEmojisInString, type SymbolEmoji } from "@/sdk/emoji_data";
import type { SortMarketsBy } from "@/sdk/index";
import { DEFAULT_POOLS_SORT_BY } from "@/sdk/indexer-v2/queries/query-params";

import { usePoolData } from "./usePoolData";

const ClientPoolsPage = ({ initialData }: { initialData: PoolsData[] }) => {
  const searchParams = useSearchParams();
  const poolParam = searchParams.get("pool");
  const [sortBy, setSortBy] = useState<SortMarketsBy>(DEFAULT_POOLS_SORT_BY);
  const [orderBy, setOrderBy] = useState<"desc" | "asc">("desc");
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>(poolParam ? 0 : undefined);
  const [page, setPage] = useState<number>(1);
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

  const accountAddress = useAccountAddress();

  useEffect(() => {
    setRealEmojis(emojis as SymbolEmoji[]);
  }, [emojis]);

  const { data: markets } = usePoolData(
    {
      account: pools === "mypools" ? accountAddress : undefined,
      page,
      sortBy,
      orderBy,
      searchBytes: realEmojis?.length ? encodeEmojis(realEmojis) : undefined,
    },
    initialData
  );

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
            <SearchBar className="hidden md:flex" />

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
      <StyledSubHeader className="flex md:hidden">
        <StyledHeaderInner>
          <SearchBar />
        </StyledHeaderInner>
      </StyledSubHeader>

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
