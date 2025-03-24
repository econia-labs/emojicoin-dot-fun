import Svg from "components/svg/Svg";
import { useThemeContext } from "context/theme-context";
import React from "react";

import type { SvgProps } from "../types";

const Icon: React.FC<SvgProps> = ({ color = "black", ...props }) => {
  const { theme } = useThemeContext();
  return (
    <Svg viewBox="0 0 27 27" {...props} color="transparent">
      <circle cx="13.4504" cy="13.4504" r="12.9504" stroke="black" />
      <path
        d="M6.92287 13.0875C6.92287 13.0875 12.4956 10.8005 14.4282 9.99517C15.1691 9.67307 17.6817 8.64226 17.6817 8.64226C17.6817 8.64226 18.8413 8.19132 18.7447 9.28651C18.7124 9.73749 18.4548 11.3159 18.1971 13.0231C17.8105 15.439 17.3918 18.0804 17.3918 18.0804C17.3918 18.0804 17.3273 18.8213 16.7797 18.9501C16.2321 19.0789 15.3302 18.4992 15.1691 18.3703C15.0403 18.2737 12.7532 16.8241 11.9157 16.1154C11.6902 15.9222 11.4326 15.5357 11.9479 15.0847C13.1076 14.0217 14.4927 12.701 15.3302 11.8635C15.7167 11.4769 16.1033 10.575 14.4927 11.6702C12.2056 13.2486 9.9508 14.7303 9.9508 14.7303C9.9508 14.7303 9.4354 15.0524 8.46905 14.7625C7.50266 14.4727 6.37524 14.0861 6.37524 14.0861C6.37524 14.0861 5.60219 13.6029 6.92287 13.0875V13.0875Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
