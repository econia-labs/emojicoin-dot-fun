import { ImageProps } from "components/image/types";
import { BoxProps } from "../types";

export interface ResponsiveBoxProps extends BoxProps {
  aspectRatio: ImageProps["aspectRatio"];
}
