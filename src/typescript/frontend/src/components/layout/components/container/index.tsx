import React, { PropsWithChildren } from "react";
import styled, { css } from "styled-components";
import { border, layout, position, space } from "styled-system";

import { useThemeContext } from "context";

import { BoxProps, BoxThemedProps } from "../types";

export const getEllipsis = ({ ellipsis }: BoxThemedProps) => {
  if (ellipsis) {
    return css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
  }
};

export const Box = styled.div<BoxProps>`
  background-color: ${({ theme, $backgroundColor }) => $backgroundColor && theme.colors[$backgroundColor]};
  cursor: ${({ cursor }) => cursor && cursor};
  pointer-events: ${({ pointerEvents }) => pointerEvents && pointerEvents};

  ${getEllipsis}
  ${border}
  ${layout}
  ${position}
  ${space}
`;

export const Container: React.FC<PropsWithChildren<BoxProps>> = ({ children, ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Box px={{ _: "16px", mobileL: "24px" }} mx="auto" maxWidth={theme.siteWidth} {...props}>
      {children}
    </Box>
  );
};
