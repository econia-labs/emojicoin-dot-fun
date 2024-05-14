import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "darkGrey", ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Svg viewBox="0 0 11 12" color="transparent" {...props}>
      <path
        d="M0 11.4065V9.28247H2.12402V11.4065H0ZM2.12402 9.28247V7.1145H4.29199V9.28247H2.12402ZM4.29199 4.99048H6.41602V7.1145H4.29199V4.99048ZM8.58398 9.28247H6.41602V7.1145H8.58398V9.28247ZM10.708 11.4065H8.58398V9.28247H10.708V11.4065ZM2.12402 2.82251H4.29199V4.99048H2.12402V2.82251ZM0 0.698486H2.12402V2.82251H0V0.698486ZM8.58398 2.82251V4.99048H6.41602V2.82251H8.58398ZM10.708 0.698486V2.82251H8.58398V0.698486H10.708Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
