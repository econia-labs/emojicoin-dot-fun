"use client";

import React, { useEffect, useState } from "react";

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
import { motion, useAnimationControls } from "framer-motion";
import { Arrow } from "components/svg";
import "./module.css";
import Big from "big.js";
import { toCoinDecimalString } from "lib/utils/decimals";
import { variants, textVariants, borderVariants, useLabelScrambler } from "../animation-config";

const TableCard: React.FC<TableCardProps> = ({
  index,
  marketID,
  symbol,
  emojis,
  staticNumSwaps,
  staticMarketCap,
  staticVolume24H,
}) => {
  const { t } = translationFunction();
  const events = useEventStore((s) => s);
  const { chats, stateEvents, liquidityEvents } = useEventStore((s) => {
    const market = s.getMarket(marketID.toString());
    return {
      chats: market ? market.chatEvents : [],
      stateEvents: market ? market.stateEvents : [],
      liquidityEvents: market ? market.liquidityEvents : [],
    };
  });
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);
  const controls = useAnimationControls();

  // TODO: Most of this component's state should be managed in `event-store` more cleanly, but for now this is an
  // initial prototype.
  // Ideally, we don't even store most data, we just store the last state in a Zustand store and use that
  // like we're using the events now, except we'd need less data and wouldn't need to do so many comparisons between
  // the static data and the data in the store.

  // TODO: Replace this with the `animate` state value we'll control in `settings-store.ts` or something.
  // Essentially, this will turn animations off.
  const shouldAnimate = true;

  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // TODO: Convert all/most usage of bigints to Big so we can have more precise bigints without having to
  // worry about overflow with `number`.
  const [marketCap, setMarketCap] = useState(Big(staticMarketCap));
  const [roughDailyVolume, setRoughDailyVolume] = useState(Big(staticVolume24H));

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (stateEvents.length === 0) return;
    const latestEvent = stateEvents.at(0)!;
    const numSwapsInStore = Big((latestEvent?.cumulativeStats.numSwaps ?? 0).toString());
    if (Big(numSwapsInStore).gt(staticNumSwaps)) {
      const marketCapInStore = latestEvent.instantaneousStats.marketCap;
      setMarketCap(Big(marketCapInStore.toString()));
    }

    // TODO: Fix ASAP. This **will** become inaccurate over time, because it doesn't evict stale data from the rolling
    // volume. It's just a rough estimate to simulate live 24h rolling volume.
    setRoughDailyVolume((prev) => prev.plus(Big(latestEvent.lastSwap.quoteVolume.toString())));

    controls
      .start(latestEvent.lastSwap.isSell ? "sell" : "buy")
      .then(() => controls.start("initial"));
    return () => controls.stop();
  }, [staticNumSwaps, stateEvents]);

  useEffect(() => {
    if (chats.length === 0) return;
    controls.start("chats").then(() => controls.start("initial"));
    return () => controls.stop();
  }, [chats]);

  useEffect(() => {
    if (liquidityEvents.length === 0) return;
    controls.start("liquidity").then(() => controls.start("initial"));
    return () => controls.stop();
  }, [liquidityEvents]);

  useEffect(() => {
    console.debug("Subscribing to events for marketID:", marketID);
    events.initializeMarket(marketID, symbol);
    subscribe.chat(marketID);
    subscribe.state(marketID);
    subscribe.liquidity(marketID);

    console.debug(`Unsubscribing from events for marketID: ${marketID}`);
    return () => {
      unsubscribe.chat(marketID);
      unsubscribe.state(marketID);
      unsubscribe.liquidity(marketID);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const { targetRef: targetRefEmojiName, tooltip: tooltipEmojiName } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { ref: marketCapRef } = useLabelScrambler(marketCap, " APT");
  const { ref: dailyVolumeRef } = useLabelScrambler(roughDailyVolume, " APT");

  return (
    <Link id="grid-emoji-card" className="group" href={`${ROUTES.market}/${marketID}`}>
      <StyledItemWrapper>
        <motion.div
          animate={controls}
          variants={shouldAnimate ? variants : {}}
          style={{
            boxShadow: "0 0 0px 0px #00000000",
            filter: "drop-shadow(0 0 0 #00000000)",
          }}
        >
          <StyledInnerItem
            id="grid-emoji-card"
            isEmpty={emojis.length === 0}
            whileHover="hover"
            style={{ border: "1px solid", borderColor: "#00000000" }}
            animate={controls}
            variants={shouldAnimate ? borderVariants : {}}
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
                <div
                  className={
                    "body-sm font-forma text-light-gray " +
                    "group-hover:text-ec-blue uppercase p-[1px] transition-all"
                  }
                >
                  {t("Market Cap")}
                </div>

                {/* TODO: Have these do a "damage"-like animation, as if it's health is being chunked.
                  Like you'd see -0.03 (the diff) pop out of the total value in red and it'd shake horizontally,
                  then fall off the screen. */}
                <motion.div
                  animate={controls}
                  variants={shouldAnimate ? textVariants : {}}
                  className="body-sm uppercase font-forma"
                  style={{ color: "#FFFFFFFF", filter: "brightness(1) contrast(1)" }}
                  ref={marketCapRef}
                >
                  {toCoinDecimalString(marketCap.toString(), 2) + " APT"}
                </motion.div>
              </Column>

              <Column width="50%">
                <div
                  className={
                    "body-sm font-forma text-light-gray " +
                    "group-hover:text-ec-blue uppercase p-[1px] transition-all"
                  }
                >
                  {t("24h Volume")}
                </div>

                <motion.div
                  animate={controls}
                  variants={shouldAnimate ? textVariants : {}}
                  className="body-sm uppercase font-forma"
                  style={{ color: "#FFFFFFFF", filter: "brightness(1) contrast(1)" }}
                  ref={dailyVolumeRef}
                >
                  {toCoinDecimalString(roughDailyVolume.toString(), 2) + " APT"}
                </motion.div>
              </Column>
            </Flex>
          </StyledInnerItem>
          {tooltipEmojiName}
        </motion.div>
      </StyledItemWrapper>
    </Link>
  );
};

export default TableCard;
