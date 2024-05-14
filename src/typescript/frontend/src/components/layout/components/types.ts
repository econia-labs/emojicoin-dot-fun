import { type HTMLAttributes, type PropsWithChildren } from "react";
import { type DefaultTheme } from "styled-components";
import { type CSS } from "styled-components/dist/types";

import {
  type BorderProps,
  type FlexboxProps,
  type LayoutProps,
  type PositionProps,
  type ResponsiveValue,
  type SpaceProps,
} from "styled-system";
import { type Colors } from "theme/types";

export interface ColumnProps extends FlexProps {}

export interface BoxProps extends BorderProps, LayoutProps, PositionProps, SpaceProps, HTMLAttributes<HTMLDivElement> {
  $backgroundColor?: keyof Colors;
  ellipsis?: boolean;
  cursor?: React.CSSProperties["cursor"];
  pointerEvents?: React.CSSProperties["pointerEvents"];
}

export interface BoxThemedProps extends BoxProps {
  theme: DefaultTheme;
}

export interface FlexProps extends BoxProps, FlexboxProps {}

export interface PageProps extends PropsWithChildren<BoxProps> {
  title?: string;
  description?: string;
  image?: string;
}

export interface FlexGapProps extends FlexProps, GapProps {}

export type GapProps = {
  gap?: ResponsiveValue<CSS.Property.Gap>;
  rowGap?: ResponsiveValue<CSS.Property.RowGap>;
  columnGap?: ResponsiveValue<CSS.Property.ColumnGap>;
};

export interface RowProps extends FlexProps {}
