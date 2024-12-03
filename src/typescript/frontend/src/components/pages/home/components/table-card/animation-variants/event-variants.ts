import { Trigger } from "@sdk/const";
import {
  type ChatEventModel,
  isChatEventModel,
  isLiquidityEventModel,
  isMarketLatestStateEventModel,
  isMarketRegistrationEventModel,
  isSwapEventModel,
  type LiquidityEventModel,
  type MarketLatestStateEventModel,
  type MarketRegistrationEventModel,
  type SwapEventModel,
} from "@sdk/indexer-v2/types";
import { ECONIA_BLUE, GREEN, PINK, WHITE } from "theme/colors";
import { useScramble } from "use-scramble";

export const transitionIn = {
  duration: 0,
};

export const transitionOut = {
  duration: 1.5,
};

export type AnyNonGridTableCardVariant =
  | TableCardGlowVariants
  | TableCardTextVariants
  | TableCardBorderVariants;
export type TableCardGlowVariants = keyof typeof glowVariants;

export const glowVariants = {
  initial: {
    boxShadow: "0 0 0px 0px #00000000",
    filter: "drop-shadow(0 0 0 #00000000)",
    transition: transitionOut,
  },
  chats: {
    boxShadow: `0 0 14px 11px ${ECONIA_BLUE}AA`,
    filter: `drop-shadow(0 0 21px ${ECONIA_BLUE}AA)`,
    transition: transitionIn,
  },
  buy: {
    boxShadow: `0 0 14px 11px ${GREEN}AA`,
    filter: `drop-shadow(0 0 21px ${GREEN}AA)`,
    transition: transitionIn,
  },
  sell: {
    boxShadow: `0 0 14px 11px ${PINK}CC`,
    filter: `drop-shadow(0 0 21px ${PINK}CC)`,
    transition: transitionIn,
  },
  register: {
    boxShadow: `0 0 14px 11px ${WHITE}AA`,
    filter: `drop-shadow(0 0 21px ${WHITE}AA)`,
    transition: transitionIn,
  },
};

export type TableCardTextVariants = keyof typeof textVariants;

export const textVariants = {
  initial: {
    color: "#FFFFFFFF",
    filter: "brightness(1) contrast(1)",
    transition: transitionOut,
  },
  buy: {
    color: `${GREEN}FF`,
    filter: "brightness(1.1) contrast(1.1)",
    transition: transitionIn,
  },
  sell: {
    color: `${PINK}FF`,
    filter: "brightness(1.1) contrast(1.1)",
    transition: transitionIn,
  },
};

export type TableCardBorderVariants = keyof typeof borderVariants;

export const borderVariants = {
  initial: {
    borderColor: "#000000",
    transition: transitionOut,
  },
  buy: {
    borderColor: GREEN,
    transition: transitionIn,
  },
  sell: {
    borderColor: PINK,
    transition: transitionIn,
  },
  chats: {
    borderColor: ECONIA_BLUE,
    transition: transitionIn,
  },
  hover: {
    borderColor: ECONIA_BLUE,
    transition: transitionIn,
  },
  register: {
    borderColor: WHITE,
    transition: transitionIn,
  },
};

export const onlyHoverVariant = {
  initial: {
    borderColor: "#00000000",
    transition: transitionOut,
  },
  hover: {
    borderColor: ECONIA_BLUE,
    transition: transitionIn,
  },
};

export type RangeCharCodes = {
  0: number;
  1: number;
} & Array<number>;

export const scrambleConfig = {
  // ASCII numbers only.
  range: [48, 57] as RangeCharCodes,
  overdrive: false,
  overflow: true,
  speed: 0.6,
  playOnMount: true,
};

export const useLabelScrambler = (value: string, suffix: string = "", prefix: string = "") => {
  // Ignore all characters in the prefix and the suffix, as long as they are not numbers.
  const ignore = ["."];
  const numberSet = new Set("0123456789");
  const suffixesAndPrefixes = new Set(prefix + suffix);
  for (const char of suffixesAndPrefixes) {
    if (!numberSet.has(char)) {
      ignore.push(char);
    }
  }

  const scrambler = useScramble({
    text: prefix + value + suffix,
    ...scrambleConfig,
    ignore,
  });

  return scrambler;
};

export const eventToVariant = (
  event?:
    | ChatEventModel
    | MarketLatestStateEventModel
    | SwapEventModel
    | LiquidityEventModel
    | MarketRegistrationEventModel
): AnyNonGridTableCardVariant => {
  if (typeof event === "undefined") return "initial";
  if (isMarketLatestStateEventModel(event)) return stateEventToVariant(event);
  if (isChatEventModel(event)) return "chats";
  if (isSwapEventModel(event)) return event.swap.isSell ? "sell" : "buy";
  if (isLiquidityEventModel(event)) return event.liquidity.liquidityProvided ? "buy" : "sell";
  if (isMarketRegistrationEventModel(event)) return "register";
  throw new Error("Unknown event type");
};

export const stateEventToVariant = (
  event: MarketLatestStateEventModel
): AnyNonGridTableCardVariant => {
  if (event.market.trigger === Trigger.MarketRegistration) return "register";
  if (event.market.trigger === Trigger.RemoveLiquidity) return "sell";
  if (event.market.trigger === Trigger.ProvideLiquidity) return "buy";
  if (event.market.trigger === Trigger.SwapBuy) return "buy";
  if (event.market.trigger === Trigger.SwapSell) return "sell";
  if (event.market.trigger === Trigger.Chat) return "chats";
  throw new Error("Unknown state event type");
};
