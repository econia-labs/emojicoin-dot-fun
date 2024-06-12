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
import ChatBox from "../chat";
import { type GridProps } from "../../types";
import SwapComponent from "../trade-emojicoin/SwapComponent";

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

        <StyledMobileContentInner>
          {tab === 1 ? (
            <TradeHistory data={props.data} />
          ) : tab === 2 ? (
            <Flex width="100%" justifyContent="center" px="17px">
              <SwapComponent
                emojicoin={props.data.symbol}
                marketAddress={props.data.marketAddress}
                numSwaps={props.data.numSwaps}
              />
            </Flex>
          ) : (
            <ChatBox data={props.data} />
          )}
        </StyledMobileContentInner>
      </StyledMobileContentBlock>
    </StyledMobileContentWrapper>
  );
};

export default MobileGrid;
