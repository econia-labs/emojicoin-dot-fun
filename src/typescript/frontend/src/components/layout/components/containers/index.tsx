"use client";

import styled, { css } from "styled-components";
import { border, layout, position, space, flexbox } from "styled-system";
import React, { type PropsWithChildren } from "react";
import {
  type ColumnProps,
  type RowProps,
  type BoxProps,
  type FlexGapProps,
  type FlexProps,
  type BoxThemedProps,
} from "@/containers";
import { system } from "styled-system";
import { siteWidth } from "theme/base";

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

/**
 * Defining Flex here to avoid circular dependencies.
 */
export const gap = system({ gap: true, rowGap: true, columnGap: true });

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
 * Defining Row here to avoid circular dependencies.
 */
export const Row = styled(Flex)<RowProps>`
  width: 100%;
  flex-wrap: wrap;
`;

export const RowBetween = styled(Row)<RowProps>`
  justify-content: space-between;
`;

/**
 * Defining Column here to avoid circular dependencies.
 */
export const Column = styled(Flex)<ColumnProps>`
  flex-direction: column;
`;
