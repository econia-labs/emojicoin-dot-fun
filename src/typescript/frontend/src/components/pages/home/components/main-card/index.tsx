"use client";

import React from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex, FlexGap } from "@/containers";
import {
  StyledEmoji,
  StyledPixelHeadingText,
  StyledDisplayFontText,
  StyledMarketDataText,
  StyledImage,
} from "./styled";
import { type ContractTypes } from "@/sdk/types/contract-types";
import { type SymbolEmojiData } from "@/sdk/emoji_data";
import { toDecimalsAPT } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";

export interface MainCardProps {
  featuredMarket?: ContractTypes.MarketView &
    SymbolEmojiData & {
      volume24H: bigint;
    };
}

const MainCard = (props: MainCardProps) => {
  const { t } = translationFunction();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center" width="100%" my={{ _: "20px", tablet: "70px" }} maxWidth="1872px">
      <Flex
        alignItems="center"
        justifyContent="center"
        maxWidth="100%"
        width="100%"
        flexDirection={{ _: "column", tablet: "row" }}
      >
        <Flex alignItems="center" position="relative" ml="-8%">
          <StyledImage src="/images/planet-home.webp" aspectRatio={1.6} alt="Planet" />

          <StyledEmoji textAlign="center">{props.featuredMarket?.emoji || "🖤"}</StyledEmoji>
        </Flex>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGrey">
            {props.featuredMarket?.metadata.market_id || "01"}
          </StyledPixelHeadingText>
          <StyledDisplayFontText ref={targetRefEmojiName} ellipsis>
            {(props.featuredMarket?.name || "BLACK HEART").toUpperCase()}
          </StyledDisplayFontText>

          <FlexGap gap="8px">
            {typeof props.featuredMarket !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("Mkt. Cap:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(props.featuredMarket!.instantaneous_stats.market_cap, 2)}{" "}
                  <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof props.featuredMarket !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("24 hour vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(props.featuredMarket!.volume24H, 2)} <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof props.featuredMarket !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("All-time vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(props.featuredMarket!.cumulative_stats.quote_volume, 2)}{" "}
                  <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>
        </Column>
        {tooltipEmojiName}
      </Flex>
    </Flex>
  );
};

export default MainCard;
