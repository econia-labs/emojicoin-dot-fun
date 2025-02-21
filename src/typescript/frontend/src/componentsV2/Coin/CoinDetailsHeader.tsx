"use client";
import React from "react";
import { HeaderContainer, CoinTitle, CoinDescription, CoinDescriptionSpan } from "./styled";

const CoinDetailsHeader = (): JSX.Element => {
  return (
    <HeaderContainer>
      <div className="mx-0 md:-mx-4 flex flex-wrap mt-16">
        <div className="w-full px-10 sm-px-10 md:w-12/12 lg:w-12/12">
          <div className="wow fadeInUp group" data-wow-delay=".1s">
            <CoinTitle>COIN TITLE HERE</CoinTitle>
            <CoinDescription>
              Join our movement. 1% of goes to{" "}
              <CoinDescriptionSpan className="text-third underline">
                Greenpeace.
              </CoinDescriptionSpan>
            </CoinDescription>
          </div>
        </div>
      </div>
    </HeaderContainer>
  );
};

export default CoinDetailsHeader;
