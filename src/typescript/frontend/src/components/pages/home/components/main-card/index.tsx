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
import { toDecimalsAPT } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import "./module.css";
import { type MarketStateProps } from "../../types";
import Link from "next/link";
import { ROUTES } from "router/routes";

export interface MainCardProps {
  featured?: MarketStateProps;
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
        <Link
          href={`${ROUTES.emojicoin}/${props.featured?.state.marketMetadata.marketID.toString()}`}
          style={{
            position: "relative",
            alignItems: "center",
            marginLeft: "-8%",
            display: "flex",
          }}
        >
          <StyledImage id="hero-image" src="/images/planet-home.webp" aspectRatio={1.6} alt="Planet" />

          <StyledEmoji>{featured?.emoji.emoji || "🖤"}</StyledEmoji>
        </Link>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGrey">
            {featured?.state.marketMetadata.marketID || "01"}
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
                  {toDecimalsAPT(featured!.state.instantaneousStats.marketCap, 2)}{" "}
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
                  {toDecimalsAPT(featured!.state.cumulativeStats.quoteVolume, 2)}{" "}
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
