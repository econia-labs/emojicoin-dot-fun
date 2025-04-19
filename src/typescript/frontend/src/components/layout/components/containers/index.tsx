"use client";

import { cn } from "lib/utils/class-name";
import React, { type PropsWithChildren } from "react";
import styled, { css } from "styled-components";
import { border, flexbox, layout, position, space, system } from "styled-system";

import type { BoxProps, BoxThemedProps, ColumnProps, FlexGapProps, FlexProps } from "@/containers";

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
export const Container: React.FC<PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn("px-6 md:px-6 mx-auto max-w-max", className)} {...props}>
      {children}
    </div>
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
