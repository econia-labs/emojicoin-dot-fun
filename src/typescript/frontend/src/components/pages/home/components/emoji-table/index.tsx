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
import SearchBar from "components/inputs/search-bar";
import FilterOptions from "./components/FilterOptions";
import { ClientGrid } from "./ClientGrid";
import type { FetchSortedMarketDataReturn } from "lib/queries/sorting/market-data";
import { MarketDataSortBy } from "lib/queries/sorting/types";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { useRouter, useSearchParams } from "next/navigation";
import { parseJSON } from "utils";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import useInputStore from "@store/input-store";
import { encodeEmojis } from "@sdk/emoji_data";

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

  const setEmojis = useInputStore((state) => state.setEmojis);
  const emojis = useInputStore((state) => state.emojis);

  const [prevQuery, setPrevQuery] = useState<string>(getQuery(page, sort, emojis));

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
    if (sort !== MarketDataSortBy.MarketCap) {
      newUrl.searchParams.set("sort", sort);
    } else {
      newUrl.searchParams.delete("sort");
    }
    if (emojis.length > 0) {
      newUrl.searchParams.set("q", encodeEmojis(emojis));
    } else {
      newUrl.searchParams.delete("q");
    }
    router.push(newUrl.toString(), { scroll: false });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [sort, emojis, page]);

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
              <SearchBar />
            </SearchWrapper>
            <FilterOptionsWrapper>
              <FilterOptions filter={sort} onChange={(value) => setSort(value)} />
            </FilterOptionsWrapper>
          </Header>
          <ClientGrid data={data} />
          <ButtonsBlock
            value={page}
            onChange={(page) => {
              setPage(page);
              if (scrollToRef.current) {
                scrollToRef.current.scrollIntoView({ behavior: "smooth" });
              }
            }}
            numberOfPages={pages}
          />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
