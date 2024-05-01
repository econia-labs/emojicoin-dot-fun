import { SVGAttributes } from "react";
import { DefaultTheme } from "styled-components";
import { SpaceProps, ResponsiveValue } from "styled-system";
import { CSS } from "styled-components/dist/types";
import { Colors } from "theme/types";

export interface SvgProps extends Omit<SVGAttributes<SVGElement>, "rotate">, SpaceProps {
  theme?: DefaultTheme;
  spin?: boolean;
  color?: keyof Colors;
  rotate?: ResponsiveValue<CSS.Property.Rotate>;
}
