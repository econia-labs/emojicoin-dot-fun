import { type BoxProps } from "components/layout/components/types";
import { type SkeletonProps } from "components/skeleton/types";
import { type ResponsiveValue } from "styled-system";

export type ImageDimensions = {
  variant?: SkeletonProps["variant"];
};

export interface ImageProps extends ImageDimensions, BoxProps {
  src: string;
  alt?: string;
  animation?: SkeletonProps["animation"];
  aspectRatio: ResponsiveValue<number>;
}
