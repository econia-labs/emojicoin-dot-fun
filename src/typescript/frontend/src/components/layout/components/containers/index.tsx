"use client";

import type { BoxProps, BoxThemedProps, ColumnProps, FlexGapProps, FlexProps } from "@containers";
import React, { type PropsWithChildren } from "react";
import styled, { css } from "styled-components";
import { border, flexbox, layout, position, space, system } from "styled-system";
import { siteWidth } from "theme/base";

const getEllipsis = ({ ellipsis }: BoxThemedProps) => {
  if (ellipsis) {
    return css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
  }
};

export const Box = styled.div<BoxProps>`
  background-color: ${({ theme, $backgroundColor }) =>
    $backgroundColor && theme.colors[$backgroundColor]};
  cursor: ${({ cursor }) => cursor && cursor};
  pointer-events: ${({ pointerEvents }) => pointerEvents && pointerEvents};

  ${getEllipsis}
  ${border}
  ${layout}
  ${position}
  ${space}
`;

/**
 * Defining Flex here to avoid circular dependencies.
 */
const gap = system({ gap: true, rowGap: true, columnGap: true });

export const Flex = styled(Box)<FlexProps>`
  display: flex;
  ${flexbox}
`;

export const Container: React.FC<PropsWithChildren<BoxProps>> = ({ children, ...props }) => {
  return (
    <Box px={{ _: "16px", mobileL: "24px" }} mx="auto" maxWidth={siteWidth} {...props}>
      {children}
    </Box>
  );
};

export const FlexGap = styled(Flex)<FlexGapProps>`
  ${gap}
`;

/**
 * Defining Column here to avoid circular dependencies.
 */
export const Column = styled(Flex)<ColumnProps>`
  flex-direction: column;
`;
