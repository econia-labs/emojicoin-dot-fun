import { type SVGAttributes } from "react";
import { type DefaultTheme } from "styled-components";
import { type SpaceProps, type ResponsiveValue } from "styled-system";
import { type CSS } from "styled-components/dist/types";
import { type Colors } from "theme/types";

export interface SvgProps extends Omit<SVGAttributes<SVGElement>, "rotate">, SpaceProps {
  theme?: DefaultTheme;
  spin?: boolean;
  color?: keyof Colors;
  rotate?: ResponsiveValue<CSS.Property.Rotate>;
}
