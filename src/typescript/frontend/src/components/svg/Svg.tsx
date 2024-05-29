"use client";

import styled, { css, keyframes } from "styled-components";
import { space } from "styled-system";
import { rotate } from "./theme";
import { type SvgProps } from "./types";
import { darkColors } from "theme/colors";

const rotateAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const spinStyle = css`
  animation: ${rotateAnimation} 2s linear infinite;
`;

const Svg = styled.svg.attrs<SvgProps>(
  ({ spin = false, color = "white", width = "20px", xmlns = "http://www.w3.org/2000/svg" }) => ({
    spin,
    color,
    width,
    xmlns,
  })
)`
  align-self: center;
  fill: ${({ theme, color }) => color && theme.colors[color]};
  flex-shrink: 0;
  transition: all 0.3s ease;
  ${({ spin }) => spin && spinStyle}
  ${rotate}
  ${space}
`;

export default Svg;
