"use client";

import React, { useEffect } from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex, FlexGap } from "@containers";
import {
  StyledEmoji,
  StyledPixelHeadingText,
  StyledDisplayFontText,
  StyledMarketDataText,
  StyledImage,
} from "./styled";
import { toCoinDecimalString } from "lib/utils/decimals";
import AptosIconBlack from "components/svg/icons/AptosBlack";
import "./module.css";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { useMarketData } from "context/websockets-context";
import { type fetchFeaturedMarket } from "lib/queries/sorting/market-data";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";

export interface MainCardProps {
  featured?: Awaited<ReturnType<typeof fetchFeaturedMarket>>;
  totalNumberOfMarkets: number;
}

const MainCard = ({ featured, totalNumberOfMarkets }: MainCardProps) => {
  const setNumMarkets = useMarketData((s) => s.setNumMarkets);

  useEffect(() => {
    setNumMarkets(totalNumberOfMarkets);
  }, [totalNumberOfMarkets, setNumMarkets]);

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
        <Link
          href={`${ROUTES.market}/${featured?.marketID.toString()}`}
          style={{
            position: "relative",
            alignItems: "center",
            marginLeft: "-8%",
            display: "flex",
          }}
        >
          <StyledImage
            id="hero-image"
            src="/images/planet-home.webp"
            aspectRatio={1.6}
            alt="Planet"
          />

          <StyledEmoji>{featured?.symbol ?? "🖤"}</StyledEmoji>
        </Link>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGray">
            {"01"}
          </StyledPixelHeadingText>
          <StyledDisplayFontText ref={targetRefEmojiName} ellipsis>
            {(featured ? emojisToName(featured.emojis) : "BLACK HEART").toUpperCase()}
          </StyledDisplayFontText>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("Mkt. Cap:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toCoinDecimalString(featured?.marketCap ?? 0, 2)}{" "}
                  <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("24 hour vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toCoinDecimalString(featured?.dailyVolume ?? 0, 2)}{" "}
                  <AptosIconBlack className={"icon-inline"} />
                </StyledMarketDataText>
              </>
            )}
          </FlexGap>

          <FlexGap gap="8px">
            {typeof featured !== "undefined" && (
              <>
                <StyledMarketDataText color="darkGray" textTransform="uppercase">
                  {t("All-time vol:")}
                </StyledMarketDataText>
                <StyledMarketDataText>
                  {toCoinDecimalString(featured!.allTimeVolume, 2)}{" "}
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
