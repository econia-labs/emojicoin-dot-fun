import React, { Suspense } from "react";

import {
  StyledContentWrapper,
  StyledContentColumn,
  StyledBlockWrapper,
  StyledContentInner,
  StyledBlock,
} from "./styled";

import ChatBox from "../chat/ChatBox";
import TradeHistory from "../trade-history";
import { type GridProps } from "../../types";
import ChartContainer from "components/charts/ChartContainer";
import SwapComponent from "../trade-emojicoin/SwapComponent";
import Loading from "components/loading";

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
                  emojis={props.data.emojis}
                  marketID={props.data.marketID.toString()}
                  marketAddress={props.data.marketView.metadata.marketAddress}
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
            <StyledBlockWrapper>
              <TradeHistory data={props.data} />
            </StyledBlockWrapper>
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
