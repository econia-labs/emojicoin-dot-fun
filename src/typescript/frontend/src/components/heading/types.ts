import { TextProps } from "components/text/types";
import { ResponsiveValue } from "styled-system";

export const scales = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
} as const;

export type Scales = (typeof scales)[keyof typeof scales];

export interface HeadingProps extends Omit<TextProps, "textScale"> {
  scale?: ResponsiveValue<Scales>;
}
