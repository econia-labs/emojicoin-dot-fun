import { type AnyNumberString } from "@sdk-types";
import type Big from "big.js";
import { toCoinDecimalString } from "lib/utils/decimals";
import { useScramble } from "use-scramble";

export const ECONIA_BLUE = "#086CD9";
export const GREEN = "#2FA90F";
export const PINK = "#CD2F8D";

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
  chats: {
    boxShadow: `0 0 14px 11px ${ECONIA_BLUE}AA`,
    transition: transitionIn,
  },
  buy: {
    boxShadow: `0 0 14px 11px ${GREEN}AA`,
    filter: `drop-shadow(0 0 21px ${GREEN})AA`,
    transition: transitionIn,
  },
  sell: {
    boxShadow: `0 0 14px 11px ${PINK}AA`,
    filter: `drop-shadow(0 0 21px ${PINK})AA`,
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
    color: `${PINK}FF`,
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
  playOnMount: false,
};

export const useLabelScrambler = (value: AnyNumberString | Big, suffix: string = "") => {
  // Ignore all characters in the suffix, as long as they are not numbers.
  const ignore = ["."];
  const numberSet = new Set("0123456789");
  const suffixSet = new Set(suffix);
  for (const char of suffixSet) {
    if (!numberSet.has(char)) {
      ignore.push(char);
    }
  }

  const scrambler = useScramble({
    text: toCoinDecimalString(value.toString(), 2) + suffix,
    ...scrambleConfig,
    ignore,
  });

  return scrambler;
};
