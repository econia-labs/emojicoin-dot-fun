"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { translationFunction } from "context/language-context";
import { Column, Flex } from "@containers";
import { Text } from "components/text";
import { type GridLayoutInformation, type TableCardProps } from "./types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useWebSocketClient } from "context/state-store-context";
import { motion, type MotionProps, useAnimationControls, useMotionValue } from "framer-motion";
import { Arrow } from "components/svg";
import Big from "big.js";
import { toCoinDecimalString } from "lib/utils/decimals";
import {
  borderVariants,
  onlyHoverVariant,
  textVariants,
  useLabelScrambler,
  glowVariants,
} from "./animation-variants/event-variants";
import { type Types } from "@sdk-types";
import { useEvent } from "@hooks/use-event";
import {
  calculateGridData,
  determineGridAnimationVariant,
  LAYOUT_DURATION,
  safeQueueAnimations,
  tableCardVariants,
} from "./animation-variants/grid-variants";
import LinkOrAnimationTrigger from "./LinkOrAnimationTrigger";
import { type Colors } from "theme/types";
import "./module.css";

const TableCard = ({
  index,
  marketID,
  symbol,
  emojis,
  staticNumSwaps,
  staticMarketCap,
  staticVolume24H,
  rowLength,
  prevIndex,
  pageOffset,
  runInitialAnimation,
  ...props
}: TableCardProps & GridLayoutInformation & MotionProps) => {
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

  // Keep track of whether or not the component is mounted to avoid animating an unmounted component.
  useLayoutEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // TODO: Most of this component's state should be managed in `event-store` more cleanly, but for now this is an
  // initial prototype.
  // Ideally, we don't even store most data, we just store the last state in a Zustand store and use that
  // like we're using the events now, except we'd need less data and wouldn't need to do so many comparisons between
  // the static data and the data in the store.

  // TODO: Replace this with the `animate` state value we'll control in `settings-store.ts` or something.
  // Essentially, this will turn animations off.
  const animationsOn = true;

  // TODO: [ROUGH_VOLUME_TAG_FOR_CTRL_F]
  // TODO: Convert all/most usage of bigints to Big so we can have more precise bigints without having to
  // worry about overflow with `number`.
  const [marketCap, setMarketCap] = useState(Big(staticMarketCap));
  const [roughDailyVolume, setRoughDailyVolume] = useState(Big(staticVolume24H));

  const animateSwaps = useEvent((swapsFromProps: string, events: readonly Types.StateEvent[]) => {
    const latestEvent = events.at(0);
    if (latestEvent) {
      const numSwapsInStore = Big((latestEvent?.cumulativeStats.numSwaps ?? 0).toString());
      if (Big(numSwapsInStore).gt(swapsFromProps)) {
        const marketCapInStore = latestEvent.instantaneousStats.marketCap;
        setMarketCap(Big(marketCapInStore.toString()));
      }

      // TODO: Fix ASAP. This **will** become inaccurate over time, because it doesn't evict stale data from the rolling
      // volume. It's just a rough estimate to simulate live 24h rolling volume.
      setRoughDailyVolume((prev) => prev.plus(Big(latestEvent.lastSwap.quoteVolume.toString())));

      safeQueueAnimations({
        controls,
        variants: [latestEvent.lastSwap.isSell ? "sell" : "buy", "initial"],
        isMounted,
        latestEvent,
      });
    }
  });

  useEffect(() => {
    animateSwaps(staticNumSwaps, stateEvents);

    return () => {
      if (isMounted.current) controls.set("initial");
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [staticNumSwaps, stateEvents, controls]);

  const animateChats = useEvent((events: readonly Types.ChatEvent[]) => {
    const latestEvent = events.at(0);
    if (latestEvent) {
      safeQueueAnimations({
        controls,
        variants: ["chats", "initial"],
        isMounted,
        latestEvent,
      });
    }
  });

  useEffect(() => {
    animateChats(chats);

    return () => {
      if (isMounted.current) controls.set("initial");
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [chats, controls]);

  const animateLiquidity = useEvent((events: readonly Types.LiquidityEvent[]) => {
    const latestEvent = events.at(0);
    if (latestEvent) {
      safeQueueAnimations({
        controls,
        variants: [latestEvent.liquidityProvided ? "buy" : "sell", "initial"],
        isMounted,
        latestEvent,
      });
    }
  });

  useEffect(() => {
    animateLiquidity(liquidityEvents);

    return () => {
      if (isMounted.current) controls.set("initial");
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [liquidityEvents, controls]);

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

  const { coordinates, variant, distance, displayIndex, layoutDelay } = useMemo(() => {
    const { coordinates, distance } = calculateGridData({
      index,
      prevIndex,
      rowLength,
    });
    const { variant, layoutDelay } = determineGridAnimationVariant({
      coordinates,
      rowLength,
      runInitialAnimation,
    });
    const displayIndex = index + pageOffset + 1;
    return {
      variant,
      distance,
      coordinates,
      displayIndex,
      layoutDelay,
    };
  }, [prevIndex, index, rowLength, pageOffset, runInitialAnimation]);

  // By default set this to 0, unless it's currently the left-most border. Sometimes we need to show a temporary border though, which we handle in the
  // layout animation begin/complete callbacks and in the style prop of the outermost motion.div.
  const borderLeftWidth = useMotionValue(coordinates.curr.col === 0 ? 1 : 0);

  return (
    <motion.div
      layout
      layoutId={index.toString()}
      className="grid-emoji-card group card-wrapper border border-solid border-dark-gray"
      variants={tableCardVariants}
      initial={{ opacity: 0 }}
      animate={variant}
      custom={{ coordinates, distance, layoutDelay }}
      transition={{
        type: "spring",
        duration: LAYOUT_DURATION,
        delay: variant === "initial" ? 0 : layoutDelay,
      }}
      style={{
        borderLeftWidth,
        borderLeftColor: "var(--dark-gray)",
        borderLeftStyle: "solid",
        borderTop: "0px solid #00000000",
        cursor: "pointer",
      }}
      onLayoutAnimationStart={() => {
        if (coordinates.curr.col === 0) {
          setTimeout(() => {
            if (isMounted.current) {
              borderLeftWidth.set(1);
            }
          }, layoutDelay * 1000);
        }
      }}
      onLayoutAnimationComplete={() => {
        // We need to get rid of the temporary border after the layout animation completes.
        if (coordinates.curr.col !== 0) {
          borderLeftWidth.set(0);
        }
      }}
      {...props}
    >
      <LinkOrAnimationTrigger emojis={emojis} marketID={marketID}>
        <motion.div
          animate={controls}
          variants={animationsOn ? glowVariants : {}}
          style={{
            boxShadow: "0 0 0px 0px #00000000",
            filter: "drop-shadow(0 0 0px #00000000)",
          }}
        >
          <motion.div
            className="flex flex-col relative grid-emoji-card w-full h-full py-[10px] px-[19px] overflow-hidden"
            whileHover="hover"
            style={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#00000000",
            }}
            animate={controls}
            variants={animationsOn ? borderVariants : onlyHoverVariant}
          >
            <Flex justifyContent="space-between" mb="7px">
              <span className="pixel-heading-2 text-dark-gray group-hover:text-ec-blue p-[1px]">
                {displayIndex < 10 ? `0${displayIndex}` : displayIndex}
              </span>

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
              title={emojisToName(emojis).toUpperCase()}
              color={
                (["green", "pink", "econiaBlue", "warning", "error"] as (keyof Colors)[])[
                  ["unshift", "portal-backwards", "portal-forwards", "default", "initial"].indexOf(
                    variant
                  )!
                ]
              }
            >
              {variant}
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
                  variants={animationsOn ? textVariants : {}}
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
                  variants={animationsOn ? textVariants : {}}
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
      </LinkOrAnimationTrigger>
    </motion.div>
  );
};

export default TableCard;
