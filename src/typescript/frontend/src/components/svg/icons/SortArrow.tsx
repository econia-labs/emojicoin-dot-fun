import Svg from "components/svg/Svg";
import { useThemeContext } from "context";
import React from "react";

import type { SvgProps } from "../types";

const SortArrow: React.FC<SvgProps> = ({ color = "darkGray", ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Svg viewBox="0 0 17 17" color="transparent" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.20657 0.703125L4.79343 0.703125V2.28999H3.20657V0.703125ZM1.58687 3.90969L1.58687 2.28999H3.20657V3.90969H1.58687ZM4.79343 2.28999L6.41313 2.28999V3.90969H4.79343V2.28999ZM0 5.49656L0 3.90969H1.58687V5.49656H0ZM6.41313 3.90969H8V5.49656L6.41313 5.49656V3.90969Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.79292 6.27632H3.20605V4.68945H4.79292V6.27632Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.79341 8.54976H3.20654V6.96289H4.79341V8.54976Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.79292 10.8242H3.20605V9.2373H4.79292V10.8242Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default SortArrow;
