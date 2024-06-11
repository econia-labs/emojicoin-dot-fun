// cspell:word istouched
import { type ElementType } from "react";
import { type DefaultTheme } from "styled-components";
import { type SpaceProps, type TypographyProps } from "styled-system";
import { type Colors } from "theme/types";
import { type PolymorphicComponentProps } from "types";

export const scales = {
  SM: "sm",
  MD: "md",
  XM: "xm",
  LG: "lg",
} as const;

export const variants = {
  PRIMARY: "primary",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];
export type Variants = (typeof variants)[keyof typeof variants];

export interface BaseInputProps extends SpaceProps, TypographyProps {
  scale?: Scales;
  touched?: boolean;
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

export type InputProps<P extends ElementType = "input"> = PolymorphicComponentProps<
  P,
  BaseInputProps
>;
