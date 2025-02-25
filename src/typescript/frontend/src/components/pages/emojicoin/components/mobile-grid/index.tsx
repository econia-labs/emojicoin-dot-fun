import React, { Suspense, useState } from "react";

import { Flex, FlexGap } from "@containers";
import { Text } from "components";
import { translationFunction } from "context/language-context";

import {
  StyledMobileContentWrapper,
  StyledMobileContentBlock,
  StyledMobileContentHeader,
  StyledMobileContentInner,
} from "./styled";
import ChatBox from "../chat/ChatBox";
import { type GridProps } from "../../types";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";
import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import { CoinHolders } from "../holders/coin-holders";
import { TradeHistory } from "../trade-history/trade-history";

const DISPLAY_HEADER_ABOVE_CHART = false;
const HEIGHT = DISPLAY_HEADER_ABOVE_CHART ? "min-h-[320px]" : "min-h-[365px]";

const TABS = ["Trades", "Swap", "Chat", "Holders"] as const;

const MobileGrid = (props: GridProps) => {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Swap");
  const { t } = translationFunction();

  return (
    <StyledMobileContentWrapper>
      <StyledMobileContentBlock className="">
        {/* Add this back in if we decide to use the custom emoji picker search bar. */}
        {DISPLAY_HEADER_ABOVE_CHART && <StyledMobileContentHeader></StyledMobileContentHeader>}
        <StyledMobileContentInner className={HEIGHT}>
          <Suspense fallback={<Loading />}>
            <ChartContainer
              symbol={props.data.symbol}
              emojis={props.data.emojis}
              marketID={props.data.marketID.toString()}
              marketAddress={props.data.marketAddress}
            />
          </Suspense>
        </StyledMobileContentInner>
      </StyledMobileContentBlock>

      <StyledMobileContentBlock>
        <StyledMobileContentHeader>
          <FlexGap gap="20px" width="fit-content">
            {TABS.map((tb) => (
              <Flex key={tb} cursor="pointer" onClick={() => setTab(tb)}>
                <Text
                  textScale="pixelHeading4"
                  color={tab === tb ? "lightGray" : "darkGray"}
                  textTransform="uppercase"
                >
                  {t(tb)}
                </Text>
              </Flex>
            ))}
          </FlexGap>
        </StyledMobileContentHeader>
        {tab === "Swap" && (
          <div style={{ width: "100%" }}>
            <LiquidityButton data={props.data} />
          </div>
        )}

        <StyledMobileContentInner>
          {tab === "Trades" && <TradeHistory data={props.data} />}
          {tab === "Holders" && (
            <CoinHolders
              emojicoin={props.data.symbol}
              holders={props.data.holders}
              marketView={props.data.marketView}
            />
          )}
          {tab === "Chat" && <ChatBox data={props.data} />}
          {tab === "Swap" && (
            <Flex width="100%" justifyContent="center" px="17px">
              <SwapComponent
                emojicoin={props.data.symbol}
                marketAddress={props.data.marketAddress}
                marketEmojis={props.data.symbolEmojis}
                initNumSwaps={props.data.swaps.length}
              />
            </Flex>
          )}
        </StyledMobileContentInner>
      </StyledMobileContentBlock>
    </StyledMobileContentWrapper>
  );
};

export default MobileGrid;
