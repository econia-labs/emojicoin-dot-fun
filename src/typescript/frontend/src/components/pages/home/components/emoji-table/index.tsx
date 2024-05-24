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
import { type SymbolEmojiData } from "@/sdk/emoji_data";
import { type ContractTypes } from "@/sdk/types";

export interface EmojiTableProps {
  markets: Array<ContractTypes.MarketView & SymbolEmojiData>;
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
            {props.markets.map(v => {
              return (
                <TableCard
                  index={Number(v.metadata.market_id)}
                  emoji={v.emoji}
                  emojiName={v.name}
                  marketCap={v.instantaneous_stats.market_cap.toString()}
                  volume24h={v.cumulative_stats.quote_volume.toString()}
                  key={v.metadata.market_id.toString()}
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
