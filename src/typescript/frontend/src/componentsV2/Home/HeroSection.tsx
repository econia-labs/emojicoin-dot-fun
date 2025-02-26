"use client";
import React, { useMemo, useState } from "react";
import { StyledImage } from "components/image/styled";
import { StatsText } from "./styled";
import { type MainCardPropsV2 } from "components/pages/home/components/main-card-v2/MainCard";
import { translationFunction } from "context/language-context";
import { sortByValue } from "lib/utils/sort-events";
import { useInterval } from "react-use";
import { useUsdMarketCap } from "@hooks/use-usd-market-cap";
import { FormattedNumber } from "components/FormattedNumber";
import Link from "next/link";

const FEATURED_MARKET_INTERVAL = 5 * 1000;
const MAX_NUM_FEATURED_MARKETS = 5;

const generateTitleSlug = (title: string | undefined) => {
  if (!title) return ""
  return title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
};

const HeroSection: React.FC<MainCardPropsV2> = (props): JSX.Element => {
  const featuredMarkets = useMemo(() => {
    return props.featuredMarkets
  }, [props.featuredMarkets]);

  const { t } = translationFunction();

  const [currentIndex, setCurrentIndex] = useState(0);

  useInterval(() => {
    setCurrentIndex((i) => (i + 1) % Math.min(featuredMarkets.length, MAX_NUM_FEATURED_MARKETS));
  }, FEATURED_MARKET_INTERVAL);

  const featured = useMemo(() => featuredMarkets.at(currentIndex), [featuredMarkets, currentIndex]);

  const { marketCap, dailyVolume, allTimeVolume } = useMemo(() => {
    return {
      marketCap: BigInt(featured?.state.instantaneousStats.marketCap ?? 0),
      dailyVolume: BigInt(featured?.dailyVolume ?? 0),
      allTimeVolume: BigInt(featured?.state.cumulativeStats.quoteVolume ?? 0),
      // priceDelta: featured?.deltaPercentage ?? 0,
    };
  }, [featured]);

  const usdMarketCap = useUsdMarketCap(marketCap);

  return (
    <>
      <div className="w-full px-4 md:w-4/12 lg:w-4/12">
        <Link href={`/coin/${generateTitleSlug(featured?.coinMeta?.title)}`} className="wow fadeInUp group" data-wow-delay=".1s">
          <StyledImage src={featured?.coinMeta?.imageURL} className="cursor-pointer [clip-path:circle(45%)]"/>
        </Link>
      </div>
      <div className="w-full px-10 sm-px-10 md:w-1/2 w60-box">
        <div className="wow fadeInUp group" data-wow-delay=".1s">
          <div className="flex  mb-5">
            <div className="mr-3 ">
              <StyledImage src="/images/home/fire.png"  />
            </div>
            <div className="px-4 py-2 font-medium text-lg border-green text-green rounded-full mr-3 b-1">
              +30.65%
            </div>
            <div className="px-4 py-2 font-medium text-lg border-white text-white rounded-full">
              1% to GREENPEACE
            </div>
          </div>
          <Link href={`/coin/${generateTitleSlug(featured?.coinMeta?.title)}`} className="mb-3 text-left main-title font-bold text-white dark:text-white cursor-pointer">
            {featured?.coinMeta?.title ?? "BLACK HEART"}
          </Link>
          <StatsText>
            {t("Mkt. Cap:")} {/* $4,675,4534.99 */}
            {usdMarketCap === undefined ? (
              <FormattedNumber value={marketCap} nominalize scramble />
            ) : (
              <FormattedNumber value={usdMarketCap} scramble />
            )}
            &nbsp;
            {usdMarketCap !== undefined && "$"}
          </StatsText>
          <StatsText>
            {t("24 hour vol:")} {/* $40,675,4534.99 */}
            <FormattedNumber value={dailyVolume} scramble nominalize />
          </StatsText>
          <StatsText>
            {t("All-time vol:")} {/* $400,675,4534.99 */}
            <FormattedNumber value={allTimeVolume} scramble nominalize />
          </StatsText>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
