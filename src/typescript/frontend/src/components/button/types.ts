import type { SvgProps } from "components/svg/types";
import type { ElementType, PropsWithChildren, ReactNode } from "react";
import type { LayoutProps, SpaceProps } from "styled-system";
import type { Colors } from "theme/types";
import type { PolymorphicComponentProps } from "types";

const variants = {
  OUTLINE: "outline",
} as const;

export const scales = {
  SMALL: "sm",
  LARGE: "lg",
  XLARGE: "xl",
} as const;

type Scale = (typeof scales)[keyof typeof scales];
type Variant = (typeof variants)[keyof typeof variants];

interface BaseButtonProps
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

export type ButtonProps<P extends ElementType = "button"> = PolymorphicComponentProps<
  P,
  BaseButtonProps
>;
