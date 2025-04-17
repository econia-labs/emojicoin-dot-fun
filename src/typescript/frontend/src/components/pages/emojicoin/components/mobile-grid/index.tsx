import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import React, { Suspense } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";

import type { GridProps } from "../../types";
import ChatBox from "../chat/ChatBox";
import { CoinHolders } from "../holders/coin-holders";
import { PersonalTradeHistory } from "../personal-trade-history/personal-trade-history";
import { LiquidityButton } from "../trade-emojicoin/LiquidityButton";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import { TradeHistory } from "../trade-history/trade-history";
import {
  StyledMobileContentBlock,
  StyledMobileContentInner,
  StyledMobileContentWrapper,
} from "./styled";

const CHART_HEIGHT = "min-h-[365px]";

const tabs = [
  {
    name: "Trades",
    emoji: emoji("money-mouth face"),
    component: (props: GridProps) => <TradeHistory data={props.data} />,
  },
  {
    name: "My Trades",
    emoji: emoji("person raising hand"),
    component: (props: GridProps) => <PersonalTradeHistory data={props.data} />,
  },
  {
    name: "Swap",
    emoji: emoji("counterclockwise arrows button"),
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
    emoji: emoji("speech balloon"),
    component: (props: GridProps) => <ChatBox data={props.data} />,
  },
  {
    name: "Holders",
    emoji: emoji("1st place medal"),
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
      <StyledMobileContentBlock>
        <StyledMobileContentInner className={CHART_HEIGHT}>
          <Suspense fallback={<Loading />}>
            <ChartContainer symbol={props.data.symbol} className="relative w-full h-[420px]" />
          </Suspense>
        </StyledMobileContentInner>
      </StyledMobileContentBlock>

      <StyledMobileContentBlock>
        <Tabs defaultValue={tabs[0].name}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.name} value={tab.name} endSlot={<Emoji emojis={tab.emoji} />}>
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
