import { type ImageProps } from "components/image/types";
import { type BoxProps } from "@/containers";

export interface ResponsiveBoxProps extends BoxProps {
  aspectRatio: ImageProps["aspectRatio"];
}
