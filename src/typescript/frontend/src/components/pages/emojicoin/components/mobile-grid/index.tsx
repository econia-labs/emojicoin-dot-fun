import React, { useState } from "react";

import { Flex, FlexGap } from "@containers";
import { Text } from "components";
import { translationFunction } from "context/language-context";

import {
  StyledMobileContentWrapper,
  StyledMobileContentBlock,
  StyledMobileContentHeader,
  StyledMobileContentInner,
} from "./styled";
import TradeHistory from "../trade-history";
import ChatBox from "../chat/ChatBox";
import { type GridProps } from "../../types";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";

const MobileGrid = (props: GridProps) => {
  const [tab, setTab] = useState(1);
  const { t } = translationFunction();

  return (
    <StyledMobileContentWrapper>
      <StyledMobileContentBlock>
        <StyledMobileContentHeader></StyledMobileContentHeader>

        <StyledMobileContentInner></StyledMobileContentInner>
      </StyledMobileContentBlock>

      <StyledMobileContentBlock>
        <StyledMobileContentHeader>
          <FlexGap gap="20px" width="fit-content">
            <Flex cursor="pointer" onClick={() => setTab(1)}>
              <Text
                textScale="pixelHeading4"
                color={tab === 1 ? "lightGray" : "darkGray"}
                textTransform="uppercase"
              >
                {t("Trade History")}
              </Text>
            </Flex>

            <Flex cursor="pointer" onClick={() => setTab(2)}>
              <Text
                textScale="pixelHeading4"
                color={tab === 2 ? "lightGray" : "darkGray"}
                textTransform="uppercase"
              >
                {t("Swap")}
              </Text>
            </Flex>

            <Flex cursor="pointer" onClick={() => setTab(3)}>
              <Text
                textScale="pixelHeading4"
                color={tab === 3 ? "lightGray" : "darkGray"}
                textTransform="uppercase"
              >
                {t("Chat")}
              </Text>
            </Flex>
          </FlexGap>
        </StyledMobileContentHeader>

        {tab === 1 ? (
          <StyledMobileContentInner>
            <TradeHistory data={props.data} />
          </StyledMobileContentInner>
        ) : tab === 2 ? (
          <>
            <div style={{ width: "100%" }}>
              <LiquidityButton data={props.data} />
            </div>
            <StyledMobileContentInner>
              <Flex width="100%" justifyContent="center" px="17px">
                <SwapComponent
                  emojicoin={props.data.symbol}
                  marketAddress={props.data.marketAddress}
                  marketID={props.data.marketID.toString()}
                  initNumSwaps={props.data.numSwaps}
                />
              </Flex>
            </StyledMobileContentInner>
          </>
        ) : (
          <StyledMobileContentInner>
            <ChatBox data={props.data} />
          </StyledMobileContentInner>
        )}
      </StyledMobileContentBlock>
    </StyledMobileContentWrapper>
  );
};

export default MobileGrid;
