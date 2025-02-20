import React, { Suspense, useState } from "react";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledBlockWrapper,
  StyledContentInner,
  StyledBlock,
} from "./styled";

import ChatBox from "../chat/ChatBox";
import { type GridProps } from "../../types";
import ChartContainer from "components/charts/ChartContainer";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import Loading from "components/loading";
import { Flex, FlexGap } from "@containers";
import Text from "components/text";
import { translationFunction } from "context/language-context";
import { CoinHolders } from "../holders/coin-holders";
import { TradeHistory } from "../trade-history/trade-history";

const tabs = ["Trade History", "Top Holders"] as const;

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
                  emojis={props.data.emojis}
                  marketID={props.data.marketID.toString()}
                  marketAddress={props.data.marketView.metadata.marketAddress}
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
              {currentTab === "Trade History" && <TradeHistory data={props.data} />}
              {currentTab === "Top Holders" && (
                <CoinHolders marketView={props.data.marketView} holders={props.data.holders} />
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
