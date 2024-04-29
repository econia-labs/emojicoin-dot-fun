import { BoxProps } from "components/layout/components/types";

export const animation = {
  WAVES: "waves",
  PULSE: "pulse",
} as const;

export const variant = {
  RECT: "rect",
  CIRCLE: "circle",
} as const;

export type Animation = (typeof animation)[keyof typeof animation];
export type Variant = (typeof variant)[keyof typeof variant];

export interface SkeletonProps extends BoxProps {
  animation?: Animation;
  variant?: Variant;
}
