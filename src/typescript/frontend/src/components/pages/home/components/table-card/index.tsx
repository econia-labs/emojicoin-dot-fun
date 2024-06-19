"use client";

import React, { useEffect } from "react";

import { translationFunction } from "context/language-context";
import useTooltip from "hooks/use-tooltip";
import { Column, Flex } from "@containers";
import { Text } from "components/text";

import { StyledInnerItem, StyledItemWrapper } from "./styled";

import { type TableCardProps } from "./types";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useWebSocketClient } from "context/websockets-context";
import { useAnimationControls } from "framer-motion";
import { Arrow } from "components/svg";
import "./module.css";
import { variants } from "./animation-variants";

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
  const { swaps, chats, liquidities } = useEventStore((s) => {
    const market = s.getMarket(marketID.toString());
    return {
      swaps: market ? market.swapEvents : [],
      chats: market ? market.chatEvents : [],
      liquidities: market ? market.liquidityEvents : [],
    };
  });
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);
  const controls = useAnimationControls();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (swaps.length === 0) return;
    controls.start("swaps").then(() => controls.start("initial"));
    return () => controls.stop();
  }, [swaps]);

  useEffect(() => {
    if (chats.length === 0) return;
    controls.start("chats").then(() => controls.start("initial"));
    return () => controls.stop();
  }, [chats]);

  useEffect(() => {
    if (liquidities.length === 0) return;
    controls.start("liquidities").then(() => controls.start("initial"));
    return () => controls.stop();
  }, [liquidities]);

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
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Link id="grid-emoji-card" className="group" href={`${ROUTES.market}/${marketID}`}>
      <StyledItemWrapper>
        <StyledInnerItem
          id="grid-emoji-card"
          isEmpty={emojis.length === 0}
          animate={controls}
          variants={variants}
          style={{ boxShadow: "0 0 0px 0px rgba(0, 0, 0, 0)" }}
        >
          <Flex justifyContent="space-between" mb="7px">
            <div className="pixel-heading-2 text-dark-gray group-hover:text-ec-blue p-[1px] transition-all">
              {index < 10 ? `0${index}` : index}
            </div>

            <Arrow className="w-[21px] !fill-current text-dark-gray group-hover:text-ec-blue transition-all" />
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
              <div className="body-sm font-forma text-light-gray group-hover:text-ec-blue uppercase p-[1px] transition-all">
                {t("Market Cap")}
              </div>

              <Text textScale="bodySmall" textTransform="uppercase">
                {marketCap + " APT"}
              </Text>
            </Column>

            <Column width="50%">
              <div className="body-sm font-forma text-light-gray group-hover:text-ec-blue uppercase p-[1px] transition-all">
                {t("24h Volume")}
              </div>

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
