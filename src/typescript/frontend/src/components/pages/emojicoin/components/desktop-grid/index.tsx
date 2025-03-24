import { Flex, FlexGap } from "@containers";
import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import Text from "components/text";
import { translationFunction } from "context/language-context";
import React, { Suspense, useState } from "react";

import type { GridProps } from "../../types";
import ChatBox from "../chat/ChatBox";
import { CoinHolders } from "../holders/coin-holders";
import { PersonalTradeHistory } from "../personal-trade-history/personal-trade-history";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import { TradeHistory } from "../trade-history/trade-history";
import {
  StyledBlock,
  StyledBlockWrapper,
  StyledContentColumn,
  StyledContentInner,
  StyledContentWrapper,
} from "./styled";

const tabs = ["Trade History", "My Trade History", "Top Holders"] as const;

const DesktopGrid = (props: GridProps) => {
  const [currentTab, setCurrentTab] = useState<(typeof tabs)[number]>("Trade History");
  const { t } = translationFunction();

  return (
    <StyledContentWrapper>
      <StyledContentInner>
        <StyledContentColumn>
          <StyledBlock width="57%" className="bg-black z-10">
            <StyledBlockWrapper>
              <Suspense fallback={<Loading numEmojis={20} />}>
                <ChartContainer
                  symbol={props.data.symbolData.symbol}
                  className="relative w-full h-[420px]"
                />
              </Suspense>
            </StyledBlockWrapper>
          </StyledBlock>
          <StyledBlock width="43%">
            <StyledBlockWrapper>
              <SwapComponent
                emojicoin={props.data.symbolData.symbol}
                marketAddress={props.data.marketView.metadata.marketAddress}
                marketEmojis={props.data.symbolEmojis}
                initNumSwaps={props.data.swaps.length}
              />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>

        <StyledContentColumn>
          <StyledBlock width="57%">
            <FlexGap className="px-6 h-10 items-center" gap="20px" width="fit-content">
              {tabs.map((tab) => (
                <Flex key={tab} cursor="pointer" onClick={() => setCurrentTab(tab)}>
                  <Text
                    textScale="pixelHeading4"
                    color={currentTab === tab ? "lightGray" : "darkGray"}
                    textTransform="uppercase"
                  >
                    {t(tab)}
                  </Text>
                </Flex>
              ))}
            </FlexGap>
            <StyledBlockWrapper>
              {currentTab === "My Trade History" && <PersonalTradeHistory data={props.data} />}
              {currentTab === "Trade History" && <TradeHistory data={props.data} />}
              {currentTab === "Top Holders" && (
                <CoinHolders
                  emojicoin={props.data.symbol}
                  marketView={props.data.marketView}
                  holders={props.data.holders}
                />
              )}
            </StyledBlockWrapper>
          </StyledBlock>

          <StyledBlock width="43%">
            <StyledBlockWrapper>
              <ChatBox data={props.data} />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>
      </StyledContentInner>
    </StyledContentWrapper>
  );
};

export default DesktopGrid;
