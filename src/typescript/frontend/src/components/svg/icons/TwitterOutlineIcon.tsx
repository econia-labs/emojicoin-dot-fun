import React from "react";
import { Svg } from "components";
import { SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "black", ...props }) => {
  const { theme } = useThemeContext();
  return (
    <Svg viewBox="0 0 28 27" {...props} color="transparent">
      <circle cx="14.3508" cy="13.4504" r="12.9504" stroke="black" />
      <path
        d="M17.8409 7.96582H19.7018L15.6363 12.6125L20.4191 18.9355H16.6742L13.7411 15.1006L10.3849 18.9355H8.52285L12.8714 13.9654L8.2832 7.96582H12.1232L14.7745 11.4711L17.8409 7.96582ZM17.1878 17.8217H18.219L11.5629 9.02116H10.4563L17.1878 17.8217Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
