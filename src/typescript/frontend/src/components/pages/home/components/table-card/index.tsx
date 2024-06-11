"use client";

import React, { useEffect } from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex } from "@containers";
import { Text } from "components/text";

import { StyledArrow, StyledInnerItem, StyledColoredText, StyledItemWrapper } from "./styled";

import { type TableCardProps } from "./types";
import "./module.css";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore } from "context/store-context";

const TableCard: React.FC<TableCardProps> = ({
  index,
  marketID,
  symbol,
  emojis,
  marketCap,
  volume24h,
}) => {
  const { t } = translationFunction();
  const initMarket = useEventStore((s) => s.maybeInitializeMarket);
  useEffect(() => {
    initMarket(marketID);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [marketID]);

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Link id="grid-emoji-card" href={`${ROUTES.market}/${marketID}`}>
      <StyledItemWrapper>
        <StyledInnerItem id="grid-emoji-card" isEmpty={emojis.length === 0}>
          <Flex justifyContent="space-between" mb="7px">
            <StyledColoredText textScale="pixelHeading2" color="darkGray">
              {index < 10 ? `0${index}` : index}
            </StyledColoredText>

            <StyledArrow />
          </Flex>

          <Text textScale="pixelHeading1" textAlign="center" mb="22px">
            {symbol}
          </Text>
          <Text
            textScale="display4"
            textTransform="uppercase"
            $fontWeight="bold"
            mb="6px"
            ellipsis
            ref={targetRefEmojiName}
          >
            {emojisToName(emojis)}
          </Text>
          <Flex>
            <Column width="50%">
              <StyledColoredText textScale="bodySmall" color="lightGray" textTransform="uppercase">
                {t("Market Cap")}
              </StyledColoredText>

              <Text textScale="bodySmall" textTransform="uppercase">
                {marketCap + " APT"}
              </Text>
            </Column>

            <Column width="50%">
              <StyledColoredText textScale="bodySmall" color="lightGray" textTransform="uppercase">
                {t("24h Volume")}
              </StyledColoredText>

              <Text textScale="bodySmall" textTransform="uppercase">
                {volume24h + " APT"}
              </Text>
            </Column>
          </Flex>
        </StyledInnerItem>
        {tooltipEmojiName}
      </StyledItemWrapper>
    </Link>
  );
};

export default TableCard;
