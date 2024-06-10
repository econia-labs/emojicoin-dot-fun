"use client";

import React from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex } from "@containers";
import { Text } from "components/text";

import { StyledArrow, StyledInnerItem, StyledColoredText, StyledItemWrapper } from "./styled";

import { type TableCardProps } from "./types";
import "./module.css";
import Link from "next/link";
import { ROUTES } from "router/routes";

const TableCard: React.FC<TableCardProps> = ({
  index,
  emoji,
  emojiName,
  marketCap,
  volume24h,
  marketID,
}) => {
  const { t } = translationFunction();

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Link id="grid-emoji-card" href={`${ROUTES.market}/${marketID}`}>
      <StyledItemWrapper>
        <StyledInnerItem id="grid-emoji-card" isEmpty={!emoji}>
          {emoji && (
            <>
              <Flex justifyContent="space-between" mb="7px">
                <StyledColoredText textScale="pixelHeading2" color="darkGray">
                  {index < 10 ? `0${index}` : index}
                </StyledColoredText>

                <StyledArrow />
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
                  <StyledColoredText
                    textScale="bodySmall"
                    color="lightGray"
                    textTransform="uppercase"
                  >
                    {t("Market Cap")}
                  </StyledColoredText>

                  <Text textScale="bodySmall" textTransform="uppercase">
                    {marketCap + " APT"}
                  </Text>
                </Column>

                <Column width="50%">
                  <StyledColoredText
                    textScale="bodySmall"
                    color="lightGray"
                    textTransform="uppercase"
                  >
                    {t("24h Volume")}
                  </StyledColoredText>

                  <Text textScale="bodySmall" textTransform="uppercase">
                    {volume24h + " APT"}
                  </Text>
                </Column>
              </Flex>
            </>
          )}
        </StyledInnerItem>
        {tooltipEmojiName}
      </StyledItemWrapper>
    </Link>
  );
};

export default TableCard;
