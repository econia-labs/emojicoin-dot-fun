import React, { Suspense } from "react";

import { Text } from "components";

import { translationFunction } from "context/language-context";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledContentHeader,
  StyledBlockWrapper,
  StyledContentInner,
  StyledBlock,
} from "./styled";

import ChatBox from "../chat/ChatBox";
import TradeHistory from "../trade-history";
import { type GridProps } from "../../types";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";
import ChartContainer from "components/charts/ChartContainer";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import Loading from "components/loading";

const DesktopGrid = (props: GridProps) => {
  const { t } = translationFunction();

  return (
    <StyledContentWrapper>
      <StyledContentInner>
        <StyledContentColumn>
          <StyledBlock
            width="57%"
            className="bg-black z-10 border-t border-solid border-t-dark-gray"
          >
            <StyledBlockWrapper>
              <Suspense fallback={<Loading numSquares={20} />}>
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
            <LiquidityButton geoblocked={props.geoblocked} data={props.data} />

            <StyledBlockWrapper>
              <SwapComponent
                emojicoin={props.data.symbolData.symbol}
                marketAddress={props.data.marketView.metadata.marketAddress}
                marketEmojis={props.data.symbolEmojis}
                initNumSwaps={props.data.swaps.length}
                geoblocked={props.geoblocked}
              />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>

        <StyledContentColumn>
          <StyledBlock width="57%">
            <StyledContentHeader>
              <Text textScale="pixelHeading3" color="lightGray" textTransform="uppercase">
                {t("Trade History")}
              </Text>
            </StyledContentHeader>

            <StyledBlockWrapper>
              <TradeHistory data={props.data} />
            </StyledBlockWrapper>
          </StyledBlock>

          <StyledBlock width="43%">
            <StyledContentHeader>
              <Text textScale="pixelHeading3" color="lightGray" textTransform="uppercase">
                {t("Chat")}
              </Text>
            </StyledContentHeader>

            <StyledBlockWrapper>
              <ChatBox geoblocked={props.geoblocked} data={props.data} />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>
      </StyledContentInner>
    </StyledContentWrapper>
  );
};

export default DesktopGrid;
