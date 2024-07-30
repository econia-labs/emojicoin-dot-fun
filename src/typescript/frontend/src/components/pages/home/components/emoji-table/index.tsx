"use client";

import React, { useEffect, useRef, useState } from "react";

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
import { MarketDataSortBy } from "lib/queries/sorting/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { useRouter, useSearchParams } from "next/navigation";
import { parseJSON } from "utils";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { useEmojiPicker } from "context/emoji-picker-context";
import { encodeEmojis } from "@sdk/emoji_data";
import { useEventStore } from "context/state-store-context";

export interface EmojiTableProps {
  data: FetchSortedMarketDataReturn["markets"];
  totalNumberOfMarkets: number;
}

const getQuery = (page: number, sort: string, emojis: string[]) => {
  const root = "/market/api";
  const pageQuery = page ? `page=${page}` : "";
  const sortByQuery = sort ? `&sortby=${sort}` : "";
  const searchBytes = emojis.length > 0 ? `&q=${encodeEmojis(emojis)}` : "";

  return `${root}?${pageQuery}${sortByQuery}${searchBytes}`;
};

const EmojiTable = (props: EmojiTableProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  let sortParam = searchParams.get("sort");
  if (!Object.values(MarketDataSortBy).includes((sortParam ?? "") as MarketDataSortBy)) {
    sortParam = "market_cap";
  }
  const [sort, setSort] = useState<MarketDataSortBy>(sortParam as MarketDataSortBy);
  const [data, setData] = useState(props.data);
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));
  const [pages, setPages] = useState(Math.ceil(props.totalNumberOfMarkets / MARKETS_PER_PAGE));
  const [prevEmojis, setPrevEmojis] = useState<string[]>([]);
  const scrollToRef = useRef<HTMLDivElement>(null);

  const setEmojis = useEmojiPicker((state) => state.setEmojis);
  const emojis = useEmojiPicker((state) => state.emojis);
  const setMode = useEmojiPicker((state) => state.setMode);

  const [prevQuery, setPrevQuery] = useState<string>(getQuery(page, sort, emojis));
  const addMarketData = useEventStore((s) => s.addMarketData);

  useEffect(() => {
    data.map((d) => addMarketData(d));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [data]);

  useEffect(() => {
    if (prevEmojis.toString() !== emojis.toString()) {
      setPrevEmojis(emojis);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }
    const query = getQuery(page, sort, emojis);

    if (prevQuery === query) {
      return;
    }

    fetch(query)
      .then((res) => res.text())
      .then((txt) => parseJSON(txt))
      .then((data) => {
        setData(data.markets);
        setPages(Math.ceil(data.count / MARKETS_PER_PAGE));
      });

    setPrevQuery(query);

    const newUrl = new URL(location.href);
    if (page !== 1) {
      newUrl.searchParams.set("page", page.toString());
    } else {
      newUrl.searchParams.delete("page");
    }
    newUrl.searchParams.set("sort", sort);
    if (emojis.length > 0) {
      newUrl.searchParams.set("q", encodeEmojis(emojis));
    } else {
      newUrl.searchParams.delete("q");
    }
    router.push(newUrl.toString(), { scroll: false });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [sort, emojis, page]);

  useEffect(() => {
    setMode("home");
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    setEmojis(symbolBytesToEmojis(q ?? "").emojis.map((e) => e.emoji));
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [q]);

  return (
    <OutermostContainer>
      <OuterContainer>
        <InnerGridContainer>
          <Header ref={scrollToRef}>
            <SearchWrapper>
              <SearchComponent />
            </SearchWrapper>
            <FilterOptionsWrapper>
              <FilterOptions filter={sort} onChange={(value) => setSort(value)} />
            </FilterOptionsWrapper>
          </Header>
          <ClientGrid data={data} sortBy={sort} page={page} numPages={pages} />
          <ButtonsBlock
            value={page}
            onChange={(page) => {
              setPage(page);
              if (scrollToRef.current) {
                scrollToRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }}
            numPages={pages}
          />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
