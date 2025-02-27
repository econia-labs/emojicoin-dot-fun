"use client";
import styled from "styled-components";
import { StyledImage } from "components/image/styled";
import React, { useState } from "react";
import { type GridProps } from "components/pages/emojicoin/types";
import ProgressBar from "./ProgressBar";
import MarketCard from "./MarketCard";
import SwapComponentV2 from "components/pages/emojicoin/components/trade-emojicoin/SwapComponentV2";

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-top: 4rem;
  position: relative;
  z-index: 10;
`;

const SideImageContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 2.5rem;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    width: 25%;
    margin-bottom: 0;
  }
`;

const MainContent = styled.div`
  width: 100%;
  padding: 0 2.5rem;
  z-index: 10;
  @media (min-width: 768px) {
    width: 50%;
  }
`;

const CoinDetailsBody = (props: GridProps & { coinImage?: string }): JSX.Element => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className="container px-4">
      <ContentWrapper>
        <SideImageContainer>
          <StyledImage
            src={props.coinImage ?? "/images/coin/match1.png"}
            style={{
              ...(props.coinImage && {
                clipPath: "circle(45%)",
              }),
              zIndex: 1,
            }}
          />
        </SideImageContainer>

        <MainContent>
          <SwapComponentV2
            emojicoin={props.data.symbol}
            marketAddress={props.data.marketAddress}
            marketEmojis={props.data.symbolEmojis}
            initNumSwaps={props.data.swaps.length}
          />
        </MainContent>

        <div className="w-full flex justify-center items-center px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <StyledImage src="/images/coin/match2.png" />
        </div>
        <div className="flex negative-margin justify-end mb-5 px-2 md:px-0 w-full z-1">
          <a href="#" onClick={() => setShowInfo(!showInfo)}>
            <StyledImage src="/images/coin/info.png" />
          </a>
        </div>
        {showInfo ? (
          <div className="flex w-full flex-wrap px-2 md:px-0 items-center justify-end">
            <div className="box-show px-5 py-3 rounded-full max-content text-white">
              1% of every trade goes to Greenpeace
            </div>

            <a href="#" onClick={() => setShowInfo(false)}>
              <StyledImage src="/images/coin/close.png" />
            </a>
          </div>
        ) : (
          <div style={{ height: "55px" }} />
        )}

        <MarketCard />
        <ProgressBar title="CORAL REEFS SAVED" progress={183} />
        <ProgressBar title="EDUCATORS TRAINED" progress={31} variant="pink" />
      </ContentWrapper>
      <StyledImage className="w-full absolute bottom-match" src="/images/home/match.png" />
    </div>
  );
};

export default CoinDetailsBody;
