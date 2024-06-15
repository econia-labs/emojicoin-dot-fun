"use client";

import React, { useDebugValue, useEffect } from "react";

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
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { useAnimationControls } from "framer-motion";
// import { useEventStore, useWebSocketClient } from "context/websockets-context";

const TableCard: React.FC<TableCardProps> = ({
  index,
  marketID,
  symbol,
  emojis,
  marketCap,
  volume24h,
}) => {
  const { t } = translationFunction();
  const events = useEventStore((s) => s);
  // const market = useEventStore((s)
  const { swaps, chats } = useEventStore((s) => {
    const market = s.getMarket(marketID.toString());
    return {
      swaps: market ? market.swapEvents : [],
      chats: market ? market.chatEvents : [],
    };
  });
  const { subscribe, unsubscribe, subscriptions } = useWebSocketClient((s) => s);
  const controls = useAnimationControls();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (swaps.length === 0) return;
    controls
      .start({
        filter: [null, "brightness(1.15)"],
        boxShadow: [null, "0 0 14px 11px #CD2F8DCC"],
        transition: {
          duration: 1,
        },
      })
      .then(() => {
        controls.start({
          filter: [null, "brightness(1)"],
          boxShadow: [null, "0 0 0 0 #00000000"],
          transition: {
            duration: 2,
            ease: "easeOut",
          },
        });
      });
  }, [swaps]);

  // filter: brightness(1.05);
  // box-shadow: 0 0 14px 11px rgba(8, 108, 217, 0.1);

  useEffect(() => {
    if (chats.length === 0) return;
    controls
      .start({
        filter: [null, "brightness(1.15)"],
        boxShadow: [null, "0 0 14px 11px #2FA90FCC"],
        transition: {
          duration: 1,
        },
      })
      .then(() => {
        controls.start({
          filter: [null, "brightness(1)"],
          boxShadow: [null, "0 0 0 0 #00000000"],
          transition: {
            duration: 2,
            ease: "easeOut",
          },
        });
      });
  }, [chats]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useDebugValue(subscriptions);

  useEffect(() => {
    events.initializeMarket(marketID, symbol);
    console.debug("Subscribing to events for marketID:", marketID);
    subscribe.chat(marketID);
    subscribe.swap(marketID, null);
    return () => {
      console.debug(`Unsubscribing from events for marketID: ${marketID}`);
      unsubscribe.chat(marketID);
      unsubscribe.swap(marketID, null);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Link id="grid-emoji-card" href={`${ROUTES.market}/${marketID}`}>
      <StyledItemWrapper>
        <StyledInnerItem
          id="grid-emoji-card"
          isEmpty={emojis.length === 0}
          animate={controls}
          style={{ boxShadow: "0 0 0 0 #00000000" }}
        >
          <Flex justifyContent="space-between" mb="7px">
            <StyledColoredText textScale="pixelHeading2" color="darkGray">
              {index < 10 ? `0${index}` : index}
            </StyledColoredText>

            <StyledArrow />
          </Flex>

          <Text textScale="pixelHeading1" textAlign="center" mb="22px">
            <span>{symbol}</span>
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
