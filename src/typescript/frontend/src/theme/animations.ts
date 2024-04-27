import { css } from "styled-components";

export const appearanceAnimationVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const appearanceAnimationMap = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
};

export const scaleAnimation = css`
  transition: all 0.3s ease;

  &:not([disabled]):active {
    transform: scale(0.95);
  }
`;
