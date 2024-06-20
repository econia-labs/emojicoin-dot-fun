import { type AnyNumberString } from "@sdk-types";
import type Big from "big.js";
import { toCoinDecimalString } from "lib/utils/decimals";
import { useScramble } from "use-scramble";

export const ECONIA_BLUE = "#086CD9";
export const GREEN = "#2FA90F";
export const PINK = "#CD2F8D";
export const RED = "#B40000";
export const RED_TEXT = "#C43333";

export const transitionIn = {
  ease: "linear",
  duration: 0.03,
};

export const transitionOut = {
  ease: "linear",
  duration: 2,
  delay: 0.3,
};

export const variants = {
  initial: {
    boxShadow: "0 0 0px 0px #00000000",
    filter: "drop-shadow(0 0 0 #00000000)",
    transition: transitionOut,
  },
  state: {
    boxShadow: `0 0 14px 11px ${PINK}AA`,
    transition: transitionIn,
  },
  chats: {
    boxShadow: `0 0 14px 11px ${PINK}AA`,
    transition: transitionIn,
  },
  liquidity: {
    boxShadow: `0 0 14px 11px ${ECONIA_BLUE}AA`,
    transition: transitionIn,
  },
  buy: {
    boxShadow: `0 0 14px 11px ${GREEN}AA`,
    filter: `drop-shadow(0 0 21px ${GREEN})AA`,
    transition: transitionIn,
  },
  sell: {
    boxShadow: `0 0 14px 11px ${RED}AA`,
    filter: `drop-shadow(0 0 21px ${RED})AA`,
    transition: transitionIn,
  },
};

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
    color: `${RED_TEXT}FF`,
    filter: "brightness(1.1) contrast(1.1)",
    transition: transitionIn,
  },
};

export const borderVariants = {
  initial: {
    borderColor: "#00000000",
    transition: transitionOut,
  },
  buy: {
    borderColor: GREEN,
    transition: transitionIn,
  },
  sell: {
    borderColor: RED,
    transition: transitionIn,
  },
  chats: {
    borderColor: PINK,
    transition: transitionIn,
  },
  state: {
    borderColor: PINK,
    transition: transitionIn,
  },
  liquidity: {
    borderColor: ECONIA_BLUE,
    transition: transitionIn,
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
  ignore: [...". APT"],
  playOnMount: false,
};

export const useLabelScrambler = (value: AnyNumberString | Big) => {
  const scrambler = useScramble({
    text: toCoinDecimalString(value.toString(), 2),
    ...scrambleConfig,
  });

  return scrambler;
};
