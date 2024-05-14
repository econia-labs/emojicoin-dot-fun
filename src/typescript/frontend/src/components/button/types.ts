import { type ElementType, type PropsWithChildren, type ReactNode } from "react";
import { type LayoutProps, type SpaceProps } from "styled-system";
import { type DefaultTheme } from "styled-components";

import { type Colors } from "theme/types";
import { type SvgProps } from "components/svg/types";
import { type PolymorphicComponentProps } from "types";

export const variants = {
  OUTLINE: "outline",
} as const;

export const scales = {
  SMALL: "sm",
  LARGE: "lg",
} as const;

export type Scale = (typeof scales)[keyof typeof scales];
export type Variant = (typeof variants)[keyof typeof variants];

export interface BaseButtonProps
  extends LayoutProps,
    SpaceProps,
    PropsWithChildren<{
      as?: "a" | "button" | ElementType;
      external?: boolean;
      isLoading?: boolean;
      scale?: Scale;
      variant?: Variant;
      color?: keyof Colors;
      disabled?: boolean;
      startIcon?: ReactNode & SvgProps;
      endIcon?: ReactNode & SvgProps;
      isScramble?: boolean;
    }> {}

export type ButtonProps<P extends ElementType = "button"> = PolymorphicComponentProps<P, BaseButtonProps>;

export interface ThemedProps extends ButtonProps {
  theme: DefaultTheme;
}
