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
import "./module.css";

export interface MainCardProps {
  featured?: {
    market: ContractTypes.MarketView;
    emoji: SymbolEmojiData;
    volume24H: bigint;
  };
}

const MainCard = (props: MainCardProps) => {
  const { t } = translationFunction();

  const featured = props.featured;

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
        <div
          style={{
            position: "relative",
            alignItems: "center",
            marginLeft: "-8%",
            display: "flex",
          }}
        >
          <StyledImage id="hero-image" src="/images/planet-home.webp" aspectRatio={1.6} alt="Planet" />

          <StyledEmoji>{featured?.emoji.emoji || "🖤"}</StyledEmoji>
        </div>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGrey">
            {featured?.market.metadata.marketID || "01"}
          </StyledPixelHeadingText>
          <StyledDisplayFontText ref={targetRefEmojiName} ellipsis>
            {(featured?.emoji.name || "BLACK HEART").toUpperCase()}
          </StyledDisplayFontText>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("Mkt. Cap:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(featured!.market.instantaneousStats.marketCap, 2)}{" "}
                  <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("24 hour vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(featured?.volume24H, 2) || "143.31"} <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGrey" textTransform="uppercase">
                  {t("All-time vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toDecimalsAPT(featured!.market.cumulativeStats.quoteVolume, 2)}{" "}
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
