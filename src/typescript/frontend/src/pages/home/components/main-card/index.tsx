import React from "react";

import { useTranslation } from "context";
import { useTooltip } from "hooks";

import { Column, Flex, FlexGap, Text, Image } from "components";
import { StyledBorder } from "./styled";

const MainCard: React.FC = () => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Flex justifyContent="center" width="100%" maxWidth="1295px">
      <Flex alignItems="center">
        <Flex alignItems="center">
          <Image src="/images/half-planet.webp" aspectRatio={1} width="500px" />
          <StyledBorder>
            <Text pt="32px" textAlign="center" textScale="pixelDisplay1">
              🖤
            </Text>
          </StyledBorder>
        </Flex>

        <Column>
          <Text textScale="pixelHeading1" color="darkGrey">
            01
          </Text>
          <Text textScale="display1" ellipsis maxWidth="653px" ref={targetRefEmojiName}>
            BLACK HEART
          </Text>
          {tooltipEmojiName}

          <FlexGap gap="8px">
            <Text textScale="display4" color="darkGrey" textTransform="uppercase">
              {t("Mkt. Cap:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale="display4" color="darkGrey" textTransform="uppercase">
              {t("24 hour vol:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>

          <FlexGap gap="8px">
            <Text textScale="display4" color="darkGrey" textTransform="uppercase">
              {t("All-time vol:")}
            </Text>
            <Text textScale="display4">11.11M</Text>
          </FlexGap>
        </Column>
      </Flex>
    </Flex>
  );
};

export default MainCard;
