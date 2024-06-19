import React from "react";

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

import ChatBox from "../chat";
import TradeHistory from "../trade-history";
import { type GridProps } from "../../types";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";
import ChartContainer from "components/charts/ChartContainer";
import SwapComponent from "../trade-emojicoin/SwapComponent";

const DesktopGrid = (props: GridProps) => {
  const { t } = translationFunction();

  return (
    <StyledContentWrapper>
      <StyledContentInner>
        <StyledContentColumn>
          <StyledBlock width="57%">
            <StyledBlockWrapper>
              <ChartContainer {...props.data} marketID={props.data.marketID.toString()} />
            </StyledBlockWrapper>
          </StyledBlock>
          <StyledBlock width="43%">
            <LiquidityButton data={props.data} />

            <StyledBlockWrapper>
              <SwapComponent
                emojicoin={props.data.symbol}
                marketAddress={props.data.marketAddress}
                marketID={props.data.marketID.toString()}
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
              <ChatBox data={props.data} />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>
      </StyledContentInner>
    </StyledContentWrapper>
  );
};

export default DesktopGrid;
