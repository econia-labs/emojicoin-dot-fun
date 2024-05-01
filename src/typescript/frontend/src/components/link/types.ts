import { AnchorHTMLAttributes } from "react";
import { TextProps } from "components/text/types";
import { Colors } from "theme/types";

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color">, TextProps {
  external?: boolean;
  color?: keyof Colors;
  disabled?: boolean;
  underline?: boolean;
  reloadDocument?: boolean;
}
