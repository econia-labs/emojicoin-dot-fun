import { type DefaultTheme } from "styled-components";
import {
  type LayoutProps,
  type SpaceProps,
  type TypographyProps,
  type OpacityProps,
  type FlexboxProps,
  type ResponsiveValue,
} from "styled-system";

import { type Colors, type FontWeight } from "theme/types";

export interface ThemedProps extends TextProps {
  theme: DefaultTheme;
}

export const scales = {
  pixelDisplay1: "pixelDisplay1",
  display1: "display1",
  display2: "display2",
  display3: "display3",
  display4: "display4",
  display5: "display5",
  display6: "display6",
  pixelHeading1: "pixelHeading1",
  pixelHeading1b: "pixelHeading1b",
  pixelHeading2: "pixelHeading2",
  pixelHeading3: "pixelHeading3",
  pixelHeading4: "pixelHeading4",
  heading1: "heading1",
  heading2: "heading2",
  bodyLarge: "bodyLarge",
  bodySmall: "bodySmall",
  bodyXSmall: "bodyXSmall",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];

export interface TextProps
  extends SpaceProps,
    TypographyProps,
    LayoutProps,
    OpacityProps,
    FlexboxProps {
  color?: keyof Colors;
  ellipsis?: boolean;
  $fontWeight?: ResponsiveValue<keyof FontWeight>;
  textTransform?: "uppercase" | "lowercase" | "capitalize";
  textScale?: ResponsiveValue<Scales>;
  direction?: "ltr" | "rtl";
  wordBreak?: React.CSSProperties["wordBreak"];
  className?: string;
  title?: string;
}
