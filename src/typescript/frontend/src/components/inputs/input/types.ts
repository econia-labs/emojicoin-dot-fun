// cspell:word istouched
import type { ElementType } from "react";
import type { DefaultTheme } from "styled-components";
import type { SpaceProps, TypographyProps } from "styled-system";
import type { Colors } from "theme/types";
import type { PolymorphicComponentProps } from "types";

export const scales = {
  SM: "sm",
  MD: "md",
  XM: "xm",
  LG: "lg",
} as const;

const variants = {
  PRIMARY: "primary",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];
type Variants = (typeof variants)[keyof typeof variants];

export interface BaseInputProps extends SpaceProps, TypographyProps {
  scale?: Scales;
  touched?: boolean;
  backgroundColor?: keyof Colors;
  error?: boolean;
  variant?: Variants;
  borderColor?: keyof Colors;
}

interface ThemedProps extends BaseInputProps {
  theme: DefaultTheme;
}

interface BorderProps extends ThemedProps {
  borderColor?: keyof Colors;
}

type InputProps<P extends ElementType = "input"> = PolymorphicComponentProps<P, BaseInputProps>;
