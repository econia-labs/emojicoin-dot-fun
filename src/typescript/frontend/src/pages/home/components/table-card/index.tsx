import React from "react";

import { useTranslation } from "context";
import { useTooltip } from "hooks";

import { Arrow } from "components/svg";
import { Column, Text, Flex } from "components";
import { StyledInnerItem, StyledIconWrapper, StyledHiddenContent } from "./styled";

import { TableCardProps } from "./types";

const TableCard: React.FC<TableCardProps> = ({ index, emoji, emojiName, marketCap, volume24h }) => {
  const { t } = useTranslation();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <StyledInnerItem>
      <Flex justifyContent="space-between" mb="7px">
        <Text textScale="pixelHeading2" color="darkGrey">
          {index < 10 ? `0${index}` : index}
        </Text>

        <StyledIconWrapper>
          <Arrow width="21px" />
        </StyledIconWrapper>
      </Flex>

      <Text textScale="pixelHeading1" textAlign="center" mb="22px">
        {emoji}
      </Text>

      <Text textScale="display4" textTransform="uppercase" mb="6px" ellipsis ref={targetRefEmojiName}>
        {emojiName}
      </Text>
      {tooltipEmojiName}

      <Flex>
        <Column width="50%">
          <Text textScale="bodySmall" color="darkGrey" textTransform="uppercase">
            {t("Market Cap")}
          </Text>

          <Text textScale="bodySmall" textTransform="uppercase">
            {marketCap}
          </Text>
        </Column>

        <Column width="50%">
          <Text textScale="bodySmall" color="darkGrey" textTransform="uppercase">
            {t("24h Volume")}
          </Text>

          <Text textScale="bodySmall" textTransform="uppercase">
            {volume24h}
          </Text>
        </Column>
      </Flex>

      <StyledHiddenContent>
        <Text textScale="bodyXSmall">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda eligendi, et expedita fugiat illo impedit
          ipsum maiores numquam, omnis perspiciatis placeat qui quod repellat saepe sequi, tenetur ut voluptas
          voluptatum.
        </Text>
      </StyledHiddenContent>
    </StyledInnerItem>
  );
};

export default TableCard;
