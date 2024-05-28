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
import { toDecimalsAPT } from "lib/utils/decimals";
import { type MarketStateProps } from "../../types";

export interface EmojiTableProps {
  data: Array<MarketStateProps>;
}

const EmojiTable = async (props: EmojiTableProps) => {
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
            {props.data.map(market => {
              return (
                <TableCard
                  index={Number(market.state.marketMetadata.marketID)}
                  emoji={market.emoji.emoji}
                  emojiName={market.emoji.name}
                  marketCap={toDecimalsAPT(market.state.instantaneousStats.marketCap, 2)}
                  volume24h={toDecimalsAPT(market.state.cumulativeStats.quoteVolume, 2)}
                  key={market.state.marketMetadata.marketID.toString()}
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
