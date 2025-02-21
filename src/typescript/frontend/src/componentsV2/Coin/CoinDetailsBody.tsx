"use client";
import styled from "styled-components";
import { StyledImage } from "components/image/styled";
import React from "react";
import Link from "next/link";

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

  @media (min-width: 768px) {
    width: 50%;
  }
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
`;

const BalanceInfo = styled.div`
  h6 {
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
  }

  h4 {
    font-size: 1.25rem;
    margin-top: 4px;
    font-weight: normal !important;
    color: white;
    margin-bottom: 0.5rem;

    @media (min-width: 768px) {
      font-size: 1.5rem;
      margin-bottom: 0;
    }
  }
`;

const DetailBox = styled.div`
  display: flex;
  text-align: center;
  margin-bottom: 1.25rem;
`;

const MatchBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: between;
  margin-right: 0.75rem;

  h6 {
    color: white;
    font-size: 1.125rem;
    font-weight: 500;
  }
`;

const GreenpeaceText = styled.p`
  font-size: 1.25rem;
  color: white;
  text-align: center;
  margin-bottom: 1.25rem;
  font-family: Lora;
  font-weight: 400;
  line-height: 16.13px;
  letter-spacing: 0%;
`;

const BuyButton = styled.button`
  background: white;
  color: #1a1a1a;
  border: none !important;
  font-weight: bold;
  font-size: 1.5rem;
  padding: 0.75rem 2.5rem;
  border-radius: 9999px;
  width: 50%;
  cursor: pointer;
  z-index: 9;
`;

const CoinDetailsBody = (): JSX.Element => {
  return (
    <div className="container px-4">
      <ContentWrapper>
        <SideImageContainer>
          <StyledImage src="/images/coin/match1.png" style={{ zIndex: 1 }} />
        </SideImageContainer>

        <MainContent>
          <div className="mx-auto w-full">
            <BalanceContainer>
              <StyledImage className="mr-3" src="/images/coin/Aptos_White 2.png" />
              <BalanceInfo>
                <h6>Your balance</h6>
                <h4>100 APT</h4>
              </BalanceInfo>
            </BalanceContainer>
            <DetailBox>
              <MatchBox className="match_box w-full px-4 py-2 rounded-full justify-between flex items-center mr-3 sm-mb-5">
                <h6 className="text-lg font-medium text-white">You Deposit: 1</h6>
                <StyledImage src="/images/coin/Aptos_White 1.png" />
              </MatchBox>
              <MatchBox className="match_box w-max-content self-center px-4 py-2 rounded-full justify-between flex items-center mr-3 sm-mb-5">
                <Link href="#">
                  <StyledImage src="/images/coin/up-arrow.png" />
                </Link>
                <Link href="#">
                  <StyledImage src="/images/coin/down-arrow.png" />
                </Link>
              </MatchBox>

              <MatchBox className="match_box w-full px-4 py-2 rounded-full justify-between flex items-center sm-mb-5">
                <h6 className="text-lg font-medium text-white">You Receive: 1</h6>
              </MatchBox>
            </DetailBox>
            <GreenpeaceText>Greenpeace Receives: 0.1</GreenpeaceText>
            <div className="w-full flex justify-center sm-mb-5">
              <BuyButton>BUY</BuyButton>
            </div>
          </div>
        </MainContent>

        <div className="w-full flex justify-center items-center px-10 sm-px-10 md:w-3/12 lg:w-3/12">
          <StyledImage src="/images/coin/match2.png" />
        </div>
        <div className="flex negative-margin justify-end mb-5 w-full px-2 md:px-0">
          <a href="#">
            <StyledImage src="/images/coin/info.png" />
          </a>
        </div>
        <div className="flex w-full flex-wrap px-2 md:px-0 items-center justify-end">
          <div className="box-show px-5 py-3 rounded-full max-content text-white">
            1% of every trade goes to Greenpeace
          </div>
          <a href="#">
            <StyledImage src="/images/coin/close.png" />
          </a>
        </div>
        <div className="box-show px-5 mt-12 py-8 rounded-full round">
          <div className="mx-0 md:-mx-4 flex flex-wrap relative z-10">
            <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
              <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
                MKT CAP <br />
                $4,675,4534.99
              </h4>
            </div>
            <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
              <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
                24H VOLUME <br />
                $40,675,4534.99
              </h4>
            </div>
            <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
              <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
                ALL-TIME VOLUME <br />
                $400,675,4534.99
              </h4>
            </div>
            <div className="w-full px-10 sm-px-10 md:w-3/12 lg:w-3/12">
              <h4 className="mb-2 md:mb-0 text-xl md:text-2xl font-md md:font-bold text-center text-white dark:text-white">
                LAST SWAP <br />
                $400,675,4534.99
              </h4>
            </div>
          </div>
        </div>

        <div className="flex-box w-full mb-10">
          <h4 className="text-white title-w30 text-lg font-semibold mt-12">
            BONDING CURVE PROGRESS
          </h4>
          <div className="w-full px-2 rounded-full progress-line flex items-center mt-12">
            <div className="progress rounded-full"></div>
            <h6 className="text-secondary text-md font-semibold">53%</h6>
          </div>
        </div>
      </ContentWrapper>
      <StyledImage className="w-full absolute bottom-match" src="/images/home/match.png" />
    </div>
  );
};

export default CoinDetailsBody;
