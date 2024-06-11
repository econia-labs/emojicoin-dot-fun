import React from "react";

import { ButtonsBlock } from "./components";
import TableCard from "../table-card";
import {
  StyledGrid,
  Header,
  InnerGridContainer,
  SearchWrapper,
  OuterContainer,
  FilterOptionsWrapper,
  OutermostContainer,
} from "./styled";
import SearchComponent from "./components/Search";
import FilterOptions from "./components/FilterOptions";
import { toCoinDecimalString } from "lib/utils/decimals";
import type fetchSortedMarketData from "lib/queries/sorting/market-data";

export interface EmojiTableProps {
  data: Awaited<ReturnType<typeof fetchSortedMarketData>>["markets"];
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
          <StyledGrid>
            {props.data.map((market) => {
              return (
                <TableCard
                  {...market}
                  marketCap={toCoinDecimalString(market.marketCap, 2)}
                  volume24h={toCoinDecimalString(market.dailyVolume, 2)}
                  key={market.marketID.toString()}
                />
              );
            })}
          </StyledGrid>
          <ButtonsBlock />
        </InnerGridContainer>
      </OuterContainer>
    </OutermostContainer>
  );
};

export default EmojiTable;
