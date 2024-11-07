"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { translationFunction } from "context/language-context";
import { Column, Flex } from "@containers";
import { Text } from "components/text";
import { type GridLayoutInformation, type TableCardProps } from "./types";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { useEventStore, useUserSettings } from "context/event-store-context";
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
  eventToVariant as toVariant,
} from "./animation-variants/event-variants";
import {
  calculateGridData,
  determineGridAnimationVariant,
  type EmojicoinAnimationEvents,
  LAYOUT_DURATION,
  tableCardVariants,
} from "./animation-variants/grid-variants";
import LinkOrAnimationTrigger from "./LinkOrAnimationTrigger";
import { isMarketStateModel } from "@sdk/indexer-v2/types";
import { useEmojiPicker } from "context/emoji-picker-context";
import "./module.css";
import { type SymbolEmojiData } from "@sdk/emoji_data";

const getFontSize = (emojis: SymbolEmojiData[]) =>
  emojis.length <= 2 ? ("pixel-heading-1" as const) : ("pixel-heading-1b" as const);

const TableCard = ({
  index,
  marketID,
  symbol,
  emojis,
  staticMarketCap,
  staticVolume24H,
  rowLength,
  prevIndex,
  pageOffset,
  runInitialAnimation,
  sortBy,
  ...props
}: TableCardProps & GridLayoutInformation & MotionProps) => {
  const { t } = translationFunction();
  const isMounted = useRef(true);
  const controls = useAnimationControls();
  const animationsOn = useUserSettings((s) => s.animate);

  const [marketCap, setMarketCap] = useState(Big(staticMarketCap));
  const [dailyVolume, setDailyVolume] = useState(Big(staticVolume24H));
  const animations = useEventStore(
    (s) => s.getMarket(emojis.map((e) => e.emoji))?.stateEvents ?? []
  );
  const anySearchBytes = useEmojiPicker((s) => s.emojis.length > 0);

  // Keep track of whether or not the component is mounted to avoid animating an unmounted component.
  useLayoutEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const runAnimationSequence = useCallback(
    (event: EmojicoinAnimationEvents) => {
      const [nowMs, eventMs] = [new Date().getTime(), event.transaction.timestamp.getTime()];
      // Only animate the event if it occurred within the last 5 seconds.
      if (nowMs - eventMs < 5000) {
        const variant = toVariant(event);
        controls.stop();
        if (isMounted.current) {
          controls.start(variant).then(() => {
            controls.start("initial");
          });
        }
      }
    },
    [controls]
  );

  useEffect(() => {
    if (animations && animations.length) {
      const event = animations.at(0);
      if (!event) {
        setDailyVolume(Big(0));
        setMarketCap(Big(0));
      } else {
        setMarketCap(Big(event.state.instantaneousStats.marketCap.toString()));
        if (isMarketStateModel(event)) {
          setDailyVolume(Big(event.dailyVolume.toString()));
        }
        runAnimationSequence(event);
      }
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [animations, runAnimationSequence]);

  const { ref: marketCapRef } = useLabelScrambler(marketCap, " APT");
  const { ref: dailyVolumeRef } = useLabelScrambler(dailyVolume, " APT");

  const { curr, prev, variant, displayIndex, layoutDelay } = useMemo(() => {
    const { curr, prev } = calculateGridData({
      index,
      prevIndex,
      rowLength,
    });
    const { variant, layoutDelay } = determineGridAnimationVariant({
      curr,
      prev,
      rowLength,
      runInitialAnimation,
    });
    const displayIndex = index + pageOffset + 1;
    return {
      variant,
      curr,
      prev,
      displayIndex,
      layoutDelay,
    };
  }, [prevIndex, index, rowLength, pageOffset, runInitialAnimation]);

  // By default set this to 0, unless it's currently the left-most border. Sometimes we need to show a temporary border
  // though, which we handle in the layout animation begin/complete callbacks and in the outermost div's style prop.
  // Always show the left border when there's something in the search bar.
  const borderLeftWidth = useMotionValue(curr.col === 0 ? 1 : anySearchBytes ? 1 : 0);

  return (
    <motion.div
      layout
      layoutId={`${sortBy}-${marketID}`}
      initial={
        variant === "initial"
          ? {
              opacity: 0,
            }
          : variant === "unshift"
            ? {
                opacity: 0,
                scale: 0,
              }
            : undefined
      }
      className="grid-emoji-card group card-wrapper border-[1px] border-solid border-dark-gray"
      variants={tableCardVariants}
      animate={variant}
      custom={{ curr, prev, layoutDelay }}
      // Unfortunately, the transition for a layout animation is separate from a variant, hence why we have
      // to fill this with conditionals.
      transition={{
        type: variant === "initial" || variant === "portal-backwards" ? "just" : "spring",
        delay: variant === "initial" ? 0 : layoutDelay,
        duration:
          variant === "initial"
            ? 0
            : variant === "portal-backwards"
              ? LAYOUT_DURATION * 0.25
              : LAYOUT_DURATION,
      }}
      style={{
        borderLeftWidth,
        borderLeftColor: "var(--dark-gray)",
        borderLeftStyle: "solid",
        borderTop: "0px solid #00000000",
        cursor: "pointer",
      }}
      onLayoutAnimationStart={() => {
        // Show a temporary left border for all elements while they are changing their layout position.
        // Note that this is probably a fairly bad way to do this. It works for now but we could easily improve it.
        // The issue is that transition has a different time than the variant, and there's no way to coalesce the two
        // easily without refactoring the entire animation orchestration. For now, we can use the setTimeout.
        setTimeout(() => {
          borderLeftWidth.set(1);
        }, layoutDelay * 1000);
      }}
      onLayoutAnimationComplete={() => {
        // Get rid of the temporary border after the layout animation completes.
        if (curr.col !== 0) {
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

            <div className={`${getFontSize(emojis)} text-center mb-[22px] text-nowrap`}>
              <span>{symbol}</span>
            </div>
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
                  {toCoinDecimalString(dailyVolume.toString(), 2) + " APT"}
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
