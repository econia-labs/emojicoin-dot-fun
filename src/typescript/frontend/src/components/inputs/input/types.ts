// cspell:word istouched
import type { SpaceProps, TypographyProps } from "styled-system";
import type { Colors } from "theme/types";

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
