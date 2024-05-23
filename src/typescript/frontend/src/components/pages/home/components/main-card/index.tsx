import React from "react";

import { useTranslation } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex, FlexGap } from "@/containers";
import {
  StyledEmoji,
  StyledPixelHeadingText,
  StyledDisplayFontText,
  StyledMarketDataText,
  StyledImage,
} from "./styled";

const MainCard: React.FC = () => {
  const { t } = useTranslation();

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

          <StyledEmoji textAlign="center">🖤</StyledEmoji>
        </Flex>

        <Column maxWidth="100%" ellipsis>
          <StyledPixelHeadingText textScale="pixelHeading1" color="darkGrey">
            01
          </StyledPixelHeadingText>
          <StyledDisplayFontText ref={targetRefEmojiName} ellipsis>
            BLACK HEART
          </StyledDisplayFontText>

          <FlexGap gap="8px">
            <StyledMarketDataText color="darkGrey" textTransform="uppercase">
              {t("Mkt. Cap:")}
            </StyledMarketDataText>
            <StyledMarketDataText>11.11M</StyledMarketDataText>
          </FlexGap>

          <FlexGap gap="8px">
            <StyledMarketDataText color="darkGrey" textTransform="uppercase">
              {t("24 hour vol:")}
            </StyledMarketDataText>
            <StyledMarketDataText>11.11M</StyledMarketDataText>
          </FlexGap>

          <FlexGap gap="8px">
            <StyledMarketDataText color="darkGrey" textTransform="uppercase">
              {t("All-time vol:")}
            </StyledMarketDataText>
            <StyledMarketDataText>11.11M</StyledMarketDataText>
          </FlexGap>
        </Column>
        {tooltipEmojiName}
      </Flex>
    </Flex>
  );
};

export default MainCard;
