import ChartContainer from "components/charts/ChartContainer";
import Loading from "components/loading";
import { useUpdateSearchParam } from "lib/hooks/use-update-search-params";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs/tabs";

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
    label: "Trade History",
    id: "trade-history",
    emoji: emoji("money-mouth face"),
    component: (props: GridProps) => <TradeHistory data={props.data} />,
  },
  {
    label: "My Trade History",
    id: "my-trade-history",
    emoji: emoji("person raising hand"),
    component: (props: GridProps) => <PersonalTradeHistory data={props.data} />,
  },
  {
    label: "Top Holders",
    id: "top-holders",
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

const DesktopGrid = (props: GridProps) => {
  const searchParams = useSearchParams();
  const updateSearchParam = useUpdateSearchParam({ shallow: true });
  // Different key from MobileGrid to prevent issues when switching from desktop
  // to mobile and vice versa, since some tabs don't exist on desktop
  const tab = searchParams.get("desktop-tab") ?? tabs[0].id;

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
            <Tabs onValueChange={(v) => updateSearchParam({ "desktop-tab": v })} value={tab}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} endSlot={<Emoji emojis={tab.emoji} />}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id}>
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
