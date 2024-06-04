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

import Chat from "../chat";
import TradeEmojicoin from "../trade-emojicoin";
import TradeHistory from "../trade-history";
import { type GridProps } from "../../types";
import { LiquidityButton } from "../trade-emojicoin/components/LiquidityButton";

const DesktopGrid = (props: GridProps) => {
  const { t } = translationFunction();

  return (
    <StyledContentWrapper>
      <StyledContentInner>
        <StyledContentColumn>
          <StyledBlock width="57%">
            <StyledContentHeader>
              <Text
                textScale={{ _: "pixelHeading4", tablet: "pixelHeading3" }}
                color="lightGray"
                textTransform="uppercase"
              >
                {t("Price Chart")}
              </Text>
            </StyledContentHeader>

            <StyledBlockWrapper>
              <Text textScale="pixelHeading3" color="lightGray" textTransform="uppercase">
                Chart
              </Text>
            </StyledBlockWrapper>
          </StyledBlock>

          <StyledBlock width="43%">
            <LiquidityButton data={props.data} />

            <StyledBlockWrapper>
              <TradeEmojicoin data={props.data} />
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
              <Chat data={props.data} />
            </StyledBlockWrapper>
          </StyledBlock>
        </StyledContentColumn>
      </StyledContentInner>
    </StyledContentWrapper>
  );
};

export default DesktopGrid;
