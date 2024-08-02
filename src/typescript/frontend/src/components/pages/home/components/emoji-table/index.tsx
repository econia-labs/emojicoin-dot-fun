"use client";

import React, { useEffect, useMemo } from "react";

import { ButtonsBlock } from "./components";
import {
  Header,
  InnerGridContainer,
  SearchWrapper,
  OuterContainer,
  FilterOptionsWrapper,
  OutermostContainer,
} from "./styled";
import SearchComponent from "./components/Search";
import FilterOptions from "./components/FilterOptions";
import { ClientGrid } from "./ClientGrid";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import {
  MarketDataSortBy,
  toMarketDataSortByHomePage,
  type MarketDataSortByHomePage,
} from "lib/queries/sorting/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { useRouter } from "next/navigation";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { encodeEmojis } from "@sdk/emoji_data";
import { useEventStore } from "context/state-store-context";
import { LiveClientGrid } from "./LiveClientGrid";
import useEvent from "@hooks/use-event";

export interface EmojiTableProps {
  data: FetchSortedMarketDataReturn["markets"];
  totalNumberOfMarkets: number;
  page: number;
  sortBy?: MarketDataSortByHomePage;
  searchBytes?: string;
}

const constructURL = ({
  page,
  sort,
  searchBytes,
}: {
  page?: number;
  sort?: MarketDataSortBy;
  searchBytes?: string;
}) => {
  const newURL = new URL(location.href);
  if (typeof page === "number" && page !== 1) {
    newURL.searchParams.set("page", page.toString());
  } else {
    newURL.searchParams.delete("page");
  }
  if (sort) {
    const newSort = toMarketDataSortByHomePage(sort);
    newURL.searchParams.set("sort", newSort);
  } else {
    newURL.searchParams.delete("sort");
  }
  if (searchBytes && searchBytes !== "0x") {
    newURL.searchParams.set("q", searchBytes);
  } else {
    newURL.searchParams.delete("q");
  }
  return newURL.toString();
};

const EmojiTable = (props: EmojiTableProps) => {
  const router = useRouter();

  const { data, page, sort, pages, searchBytes } = useMemo(() => {
    const { data, page, sortBy: sort } = props;
    const pages = Math.ceil(props.totalNumberOfMarkets / MARKETS_PER_PAGE);
    const searchBytes = props.searchBytes ?? "";
    return { data, page, sort, pages, searchBytes };
  }, [props]);

  const addMarketData = useEventStore((s) => s.addMarketData);
  const setEmojis = useEmojiPicker((s) => s.setEmojis);
  const emojis = useEmojiPicker((s) => s.emojis);
  const setMode = useEmojiPicker((s) => s.setMode);

  useEffect(() => {
    data.map((d) => addMarketData(d));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data]);

  useEffect(() => {
    const decoded = symbolBytesToEmojis(searchBytes ?? "");
    if (decoded.emojis.length > 0) {
      setEmojis(decoded.emojis.map((e) => e.emoji));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [searchBytes]);

  const pushURL = useEvent(
    (args?: { page?: number; sort?: MarketDataSortBy; emojis?: string[] }) => {
      const newURL = constructURL({
        page: args?.page ?? page,
        sort: args?.sort ?? sort,
        searchBytes: encodeEmojis(args?.emojis ?? emojis),
      });

      router.push(newURL, { scroll: false });
      router.refresh();
    }
  );

  const handlePageChange = (page: number) => {
    const newPage = Math.min(Math.max(1, page), pages);
    pushURL({ page: newPage });
  };

  const handleSortChange = (newPage: MarketDataSortBy) => {
    pushURL({ sort: newPage });
  };

  useEffect(() => {
    pushURL();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [emojis]);

  useEffect(() => {
    setMode("home");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const shouldShowLive = useMemo(() => {
    return sort === MarketDataSortBy.BumpOrder && page === 1 && !searchBytes;
  }, [sort, page, searchBytes]);

  return (
    <OutermostContainer>
      <OuterContainer>
        <InnerGridContainer>
          <Header>
            <SearchWrapper>
              <SearchComponent />
            </SearchWrapper>
            <FilterOptionsWrapper>
              <FilterOptions
                filter={sort ?? MarketDataSortBy.MarketCap}
                onChange={handleSortChange}
              />
            </FilterOptionsWrapper>
          </Header>
          {shouldShowLive ? <LiveClientGrid data={data} /> : <ClientGrid data={data} page={page} />}
          <ButtonsBlock value={page} onChange={handlePageChange} numPages={pages} />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
