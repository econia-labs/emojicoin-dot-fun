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
import { toDecimalsAPT } from "lib/utils/decimals";

export interface EmojiTableProps {
  markets: Array<{
    market: ContractTypes.MarketView;
    emoji: SymbolEmojiData;
    volume24H: bigint;
  }>;
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
                  index={Number(v.market.metadata.marketID)}
                  emoji={v.emoji.emoji}
                  emojiName={v.emoji.name}
                  marketCap={toDecimalsAPT(v.market.instantaneousStats.marketCap, 2)}
                  volume24h={toDecimalsAPT(v.market.cumulativeStats.quoteVolume, 2)}
                  key={v.market.metadata.marketID.toString()}
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
