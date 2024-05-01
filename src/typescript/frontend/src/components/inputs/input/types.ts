import { ElementType } from "react";
import { DefaultTheme } from "styled-components";
import { SpaceProps, TypographyProps } from "styled-system";
import { Colors } from "theme/types";
import { PolymorphicComponentProps } from "types";

export const scales = {
  SM: "sm",
  MD: "md",
  LG: "lg",
} as const;

export const variants = {
  PRIMARY: "primary",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];
export type Variants = (typeof variants)[keyof typeof variants];

export interface BaseInputProps extends SpaceProps, TypographyProps {
  scale?: Scales;
  isTouched?: boolean;
  backgroundColor?: keyof Colors;
  error?: boolean;
  variant?: Variants;
  borderColor?: keyof Colors;
}

export interface ThemedProps extends BaseInputProps {
  theme: DefaultTheme;
}

export interface BorderProps extends ThemedProps {
  borderColor?: keyof Colors;
}

export type InputProps<P extends ElementType = "input"> = PolymorphicComponentProps<P, BaseInputProps>;
