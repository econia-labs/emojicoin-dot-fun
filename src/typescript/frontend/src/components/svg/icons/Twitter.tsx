import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "white", ...props }) => {
  const { theme } = useThemeContext();
  return (
    <Svg viewBox="0 0 28 27" {...props} color="transparent">
      <circle cx="13.6487" cy="13.4504" r="13.4504" fill={theme.colors[color]} />
      <path
        d="M17.1388 7.96582H18.9997L14.9341 12.6125L19.7169 18.9355H15.9721L13.0389 15.1006L9.68274 18.9355H7.8207L12.1692 13.9654L7.58105 7.96582H11.421L14.0723 11.4711L17.1388 7.96582ZM16.4857 17.8217H17.5168L10.8607 9.02116H9.75419L16.4857 17.8217Z"
        fill={theme.colors.black}
      />
    </Svg>
  );
};

export default Icon;
