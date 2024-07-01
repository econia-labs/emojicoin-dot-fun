import React from "react";

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

export interface EmojiTableProps {
  data: FetchSortedMarketDataReturn["markets"];
  totalNumberOfMarkets: number;
}

const EmojiTable = (props: EmojiTableProps) => {
  return (
    <OutermostContainer>
      <OuterContainer>
        <InnerGridContainer>
          <Header>
            <SearchWrapper>
              <SearchComponent />
            </SearchWrapper>
            <FilterOptionsWrapper>
              <FilterOptions />
            </FilterOptionsWrapper>
          </Header>
          <ClientGrid {...props} />
          <ButtonsBlock />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
