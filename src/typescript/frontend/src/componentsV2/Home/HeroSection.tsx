"use client";
import { StyledImage } from "components/image/styled";
import React from "react";
import { StatsText } from "./styled";

const HeroSection = (): JSX.Element => {
  return (
    <>
      <div className="w-full px-4 md:w-4/12 lg:w-4/12">
        <div className="wow fadeInUp group" data-wow-delay=".1s">
          <StyledImage src="/images/home/banner-circle.png" />
        </div>
      </div>
      <div className="w-full px-10 sm-px-10 md:w-1/2 w60-box">
        <div className="wow fadeInUp group" data-wow-delay=".1s">
          <div className="flex  mb-5">
            <div className="mr-3">
              <StyledImage src="/images/home/fire.png" />
            </div>
            <div className="px-4 py-2 font-medium text-lg border-green text-green rounded-full mr-3 b-1">
              +30.65%
            </div>
            <div className="px-4 py-2 font-medium text-lg border-white text-white rounded-full">
              1% to GREENPEACE
            </div>
          </div>
          <h1 className="mb-3 text-left main-title font-bold text-white dark:text-white">
            #1 COIN TITLE
          </h1>
          <StatsText>
            MKT CAP: <span>$4,675,4534.99</span>
          </StatsText>
          <StatsText>
            24H VOLUME: <span>$40,675,4534.99</span>
          </StatsText>
          <StatsText>
            ALL-TIME VOLUME: <span>$400,675,4534.99</span>
          </StatsText>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
