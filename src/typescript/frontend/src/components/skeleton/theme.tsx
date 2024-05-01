import { css, keyframes } from "styled-components";
import { Animation } from "./types";

const waves = keyframes`
  from {
    left: -9.375rem;
  }
  to {
    left: 100%;
  }
`;

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

export const variantStyles = (animation: Animation = "pulse") => {
  return {
    pulse: css`
      animation: ${pulse} 2s infinite ease-out;
      transform: translate3d(0, 0, 0);
    `,
    waves: css`
      overflow: hidden;
      transform: translate3d(0, 0, 0);
      &:before {
        content: "";
        position: absolute;
        background-image: linear-gradient(90deg, transparent, rgba(243, 243, 243, 0.5), transparent);
        top: 0;
        left: -9.375rem;
        height: 100%;
        width: 9.375rem;
        animation: ${waves} 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
    `,
  }[animation];
};
