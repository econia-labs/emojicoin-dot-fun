import { type AnchorHTMLAttributes } from "react";
import { type TextProps } from "components/text/types";
import { type Colors } from "theme/types";

export interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">,
    TextProps {
  external?: boolean;
  color?: keyof Colors;
  disabled?: boolean;
  underline?: boolean;
}
