import type { BoxProps } from "@containers";
import type { ImageProps } from "components/image/types";

export interface ResponsiveBoxProps extends BoxProps {
  aspectRatio: ImageProps["aspectRatio"];
}
