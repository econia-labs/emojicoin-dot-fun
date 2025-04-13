import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import React, { Suspense } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";
import { namesToEmojis } from "@/sdk/index";

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

const tabs = [
  {
    name: "Trade History",
    emoji: namesToEmojis("money-mouth face"),
    component: (props: GridProps) => <TradeHistory data={props.data} />,
  },
  {
    name: "My Trade History",
    emoji: namesToEmojis("person raising hand"),
    component: (props: GridProps) => <PersonalTradeHistory data={props.data} />,
  },
  {
    name: "Top Holders",
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

const DesktopGrid = (props: GridProps) => {
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
            <Tabs defaultValue={tabs[0].name}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.name}
                    value={tab.name}
                    endSlot={<div className="text-[1.1rem]">{tab.emoji}</div>}
                  >
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
