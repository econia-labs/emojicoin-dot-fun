import React from "react";

import { useTranslation } from "context";
import { useTooltip } from "hooks";

import { Arrow } from "components/svg";
import { Column, Text, Flex } from "components";
import { StyledInnerItem, StyledColoredText, StyledItemWrapper } from "./styled";

import { TableCardProps } from "./types";

const TableCard: React.FC<TableCardProps> = ({ index, emoji, emojiName, marketCap, volume24h }) => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <StyledItemWrapper>
      <StyledInnerItem>
        <Flex justifyContent="space-between" mb="7px">
          <StyledColoredText textScale="pixelHeading2" color="darkGrey">
            {index < 10 ? `0${index}` : index}
          </StyledColoredText>

          <Arrow width="21px" />
        </Flex>

        <Text textScale="pixelHeading1" textAlign="center" mb="22px">
          {emoji}
        </Text>

        <Text
          textScale="display4"
          textTransform="uppercase"
          $fontWeight="bold"
          mb="6px"
          ellipsis
          ref={targetRefEmojiName}
        >
          {emojiName}
        </Text>

        <Flex>
          <Column width="50%">
            <StyledColoredText textScale="bodySmall" color="lightGrey" textTransform="uppercase">
              {t("Market Cap")}
            </StyledColoredText>

            <Text textScale="bodySmall" textTransform="uppercase">
              {marketCap}
            </Text>
          </Column>

          <Column width="50%">
            <StyledColoredText textScale="bodySmall" color="lightGrey" textTransform="uppercase">
              {t("24h Volume")}
            </StyledColoredText>

            <Text textScale="bodySmall" textTransform="uppercase">
              {volume24h}
            </Text>
          </Column>
        </Flex>
      </StyledInnerItem>
      {tooltipEmojiName}
    </StyledItemWrapper>
  );
};

export default TableCard;
