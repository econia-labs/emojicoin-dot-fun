import { ResponsiveValue } from "styled-system";

import { BoxProps } from "components/layout/components/types";
import { SkeletonProps } from "components/skeleton/types";

export type ImageDimensions = {
  variant?: SkeletonProps["variant"];
};

export interface ImageProps extends ImageDimensions, BoxProps {
  src: string;
  alt?: string;
  animation?: SkeletonProps["animation"];
  aspectRatio: ResponsiveValue<number>;
}
