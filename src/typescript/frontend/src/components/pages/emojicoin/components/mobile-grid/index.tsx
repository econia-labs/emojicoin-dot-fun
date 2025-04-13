import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import React, { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";
import { namesToEmojis } from "@/sdk/index";

import type { GridProps } from "../../types";
import ChatBox from "../chat/ChatBox";
import { CoinHolders } from "../holders/coin-holders";
import { PersonalTradeHistory } from "../personal-trade-history/personal-trade-history";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import { TradeHistory } from "../trade-history/trade-history";
import {
  StyledMobileContentBlock,
  StyledMobileContentHeader,
  StyledMobileContentInner,
  StyledMobileContentWrapper,
} from "./styled";

const DISPLAY_HEADER_ABOVE_CHART = false;
const HEIGHT = DISPLAY_HEADER_ABOVE_CHART ? "min-h-[320px]" : "min-h-[365px]";

const tabs = [
  {
    name: "Trades",
    emoji: namesToEmojis("money-mouth face"),
    component: (props: GridProps) => <TradeHistory data={props.data} />,
  },
  {
    name: "My Trades",
    emoji: namesToEmojis("person raising hand"),
    component: (props: GridProps) => <PersonalTradeHistory data={props.data} />,
  },
  {
    name: "Swap",
    emoji: namesToEmojis("counterclockwise arrows button"),
    component: (props: GridProps) => (
      <div className="flex flex-col items-center">
        <LiquidityButton data={props.data} />
        <div className="flex items-center justify-center pt-10 py-8 w-full bg-black">
          <SwapComponent
            emojicoin={props.data.symbol}
            marketAddress={props.data.marketAddress}
            marketEmojis={props.data.symbolEmojis}
            initNumSwaps={props.data.swaps.length}
          />
        </div>
      </div>
    ),
  },
  {
    name: "Chat",
    emoji: namesToEmojis("speech balloon"),
    component: (props: GridProps) => <ChatBox data={props.data} />,
  },
  {
    name: "Holders",
    emoji: namesToEmojis("1st place medal"),
    component: (props: GridProps) => (
      <CoinHolders
        emojicoin={props.data.symbol}
        marketView={props.data.marketView}
        holders={props.data.holders}
      />
    ),
  },
] as const;

const MobileGrid = (props: GridProps) => {
  return (
    <StyledMobileContentWrapper>
      <StyledMobileContentBlock className="">
        {/* Add this back in if we decide to use the custom emoji picker search bar. */}
        {DISPLAY_HEADER_ABOVE_CHART && <StyledMobileContentHeader></StyledMobileContentHeader>}
        <StyledMobileContentInner className={HEIGHT}>
          <Suspense fallback={<Loading />}>
            <ChartContainer symbol={props.data.symbol} className="relative w-full h-[420px]" />
          </Suspense>
        </StyledMobileContentInner>
      </StyledMobileContentBlock>

      <StyledMobileContentBlock>
        <Tabs defaultValue={tabs[0].name}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.name} value={tab.name} endSlot={tab.emoji}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.name} value={tab.name}>
              {tab.component(props)}
            </TabsContent>
          ))}
        </Tabs>
      </StyledMobileContentBlock>
    </StyledMobileContentWrapper>
  );
};

export default MobileGrid;
