"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { translationFunction } from "context/language-context";
import { Column, Flex } from "@containers";
import { Text } from "components/text";

import { type GridLayoutInformation, type TableCardProps } from "./types";
import Link from "next/link";
import { ROUTES } from "router/routes";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { motion, useAnimationControls } from "framer-motion";
import { Arrow } from "components/svg";
import "./module.css";
import Big from "big.js";
import { toCoinDecimalString } from "lib/utils/decimals";
import {
  borderVariants,
  onlyHoverVariant,
  textVariants,
  useLabelScrambler,
  variants,
} from "../animation-config";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { type Types } from "@sdk-types";
import { useEvent } from "@hooks/use-event";
import { tableCardVariants } from "./animation-variants";

const TableCard = ({
  index,
  marketID,
  symbol,
  emojis,
  staticNumSwaps,
  staticMarketCap,
  staticVolume24H,
  itemsPerLine,
  prevIndex,
  pageOffset,
  runInitialAnimation,
}: TableCardProps & GridLayoutInformation) => {
  const { t } = translationFunction();
  const events = useEventStore((s) => s);
  const chats = useEventStore((s) => s.getMarket(marketID.toString())?.chatEvents ?? []);
  const stateEvents = useEventStore((s) => s.getMarket(marketID.toString())?.stateEvents ?? []);
  const liquidityEvents = useEventStore(
    (s) => s.getMarket(marketID.toString())?.liquidityEvents ?? []
  );
  const { subscribe, unsubscribe } = useWebSocketClient((s) => s);
  const isMounted = useRef(true);
  const controls = useAnimationControls();

  // In order to avoid calling `controls.start(...)` on unmounted components, we need to keep track of whether
  // the component is mounted or not.
  useLayoutEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

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

  const animateSwaps = useEvent(
    (args: { staticNumSwaps: string; stateEvents: readonly Types.StateEvent[] }) => {
      const { staticNumSwaps, stateEvents } = args;
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

      controls.start(latestEvent.lastSwap.isSell ? "sell" : "buy").then(() => {
        if (isMounted.current) {
          controls.start("initial");
        }
      });

      return () => controls.stop();
    }
  );

  useEffect(() => {
    animateSwaps({ staticNumSwaps, stateEvents });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [staticNumSwaps, stateEvents]);

  const animateChats = useEvent((args: { chats: readonly Types.ChatEvent[] }) => {
    const { chats } = args;
    if (chats.length === 0) return;
    controls.start("chats").then(() => {
      if (isMounted.current) {
        controls.start("initial");
      }
    });

    return () => controls.stop();
  });

  useEffect(() => {
    animateChats({ chats });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [chats]);

  const animateLiquidity = useEvent(
    (args: { liquidityEvents: readonly Types.LiquidityEvent[] }) => {
      const { liquidityEvents } = args;
      if (liquidityEvents.length === 0) return;
      const latestEvent = liquidityEvents.at(0)!;
      controls.start(latestEvent.liquidityProvided ? "buy" : "sell").then(() => {
        if (isMounted.current) {
          controls.start("initial");
        }
      });

      return () => controls.stop();
    }
  );

  useEffect(() => {
    animateLiquidity({ liquidityEvents });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [liquidityEvents]);

  useEffect(() => {
    events.initializeMarket(marketID, symbol);
    subscribe.chat(marketID);
    subscribe.state(marketID);
    subscribe.liquidity(marketID);

    return () => {
      unsubscribe.chat(marketID);
      unsubscribe.state(marketID);
      unsubscribe.liquidity(marketID);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const { ref: marketCapRef } = useLabelScrambler(marketCap, " APT");
  const { ref: dailyVolumeRef } = useLabelScrambler(roughDailyVolume, " APT");
  const indexWithOffset = useMemo(() => index + pageOffset, [index, pageOffset]);

  const variant: keyof typeof tableCardVariants = useMemo(() => {
    if (runInitialAnimation) return "initial";
    const inPreviousGrid = typeof prevIndex !== "undefined";
    const isMovingToNewLine = inPreviousGrid && prevIndex % itemsPerLine === 0;
    const isBeingInserted = !inPreviousGrid;
    const isMovingForwards = inPreviousGrid && prevIndex < index;
    const isMovingBackwards = inPreviousGrid && prevIndex > index;
    const isMoving = isMovingBackwards || isMovingForwards;

    // Note that we have to check if it's moving here or it won't trigger the layout animation correctly.
    // Set the `symbol` span to `variant` to view this in action and how it works.
    if (isMovingToNewLine) return isMoving ? "toNewLine" : "default";
    if (isBeingInserted) return "unshift";
    if (isMovingBackwards) return "backwards";
    if (isMovingForwards) return "default";
    return "default";
  }, [prevIndex, index, itemsPerLine, runInitialAnimation]);

  return (
    <motion.div
      layout
      className="grid-emoji-card group card-wrapper last:border-r last:border-solid last:border-dark-gray"
      variants={tableCardVariants}
      animate={variant}
      custom={index}
      style={{
        borderLeft: "1px solid var(--dark-gray)",
        borderRight: index % itemsPerLine !== 0 ? undefined : "1px solid var(--dark-gray)",
      }}
    >
      <Link href={`${ROUTES.market}/${emojiNamesToPath(emojis.map((x) => x.name))}`}>
        <motion.div
          animate={controls}
          variants={shouldAnimate ? variants : {}}
          style={{
            boxShadow: "0 0 0px 0px #00000000",
            filter: "drop-shadow(0 0 0px #00000000)",
          }}
        >
          <motion.div
            className="flex flex-col relative grid-emoji-card w-full h-full py-[10px] px-[19px] overflow-hidden"
            whileHover="hover"
            style={{
              border: "1px solid",
              borderColor: "#00000000",
              cursor: emojis.length ? "pointer" : "unset",
            }}
            animate={controls}
            variants={shouldAnimate ? borderVariants : onlyHoverVariant}
          >
            <Flex justifyContent="space-between" mb="7px">
              <motion.div className="pixel-heading-2 text-dark-gray group-hover:text-ec-blue p-[1px] transition-all">
                {indexWithOffset < 10 ? `0${indexWithOffset}` : indexWithOffset}
              </motion.div>

              <Arrow className="w-[21px] !fill-current text-dark-gray group-hover:text-ec-blue transition-all" />
            </Flex>

            <Text textScale="pixelHeading1" textAlign="center" mb="22px">
              <span>{variant}</span>
            </Text>
            <Text
              textScale="display4"
              textTransform="uppercase"
              $fontWeight="bold"
              mb="6px"
              ellipsis
              title={emojisToName(emojis).toUpperCase()}
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
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default TableCard;
