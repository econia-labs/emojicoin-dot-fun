export const ECONIA_BLUE = "rgba(8, 108, 217, 1)";
export const GREEN = "rgba(47, 169, 15, 1)";
export const PINK = "rgba(205, 47, 141, 1)";

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
    boxShadow: "0 0 0px 0px rgba(0, 0, 0, 0)",
    transition: transitionOut,
  },
  swaps: {
    boxShadow: `0 0 14px 11px ${PINK}`,
    transition: transitionIn,
  },
  chats: {
    boxShadow: `0 0 14px 11px ${GREEN}`,
    transition: transitionIn,
  },
  liquidities: {
    boxShadow: `0 0 14px 11px ${ECONIA_BLUE}`,
    transition: transitionIn,
  },
};
