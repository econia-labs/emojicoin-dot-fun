import React from "react";
import { Svg } from "components";
import { SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "white", ...props }) => {
  const { theme } = useThemeContext();
  return (
    <Svg viewBox="0 0 28 27" {...props} color="transparent">
      <circle cx="13.7478" cy="13.4504" r="13.4504" fill={theme.colors[color]} />
      <path
        d="M14.6422 18.9355V13.9317H16.4063L16.6704 11.9817H14.6421V10.7366C14.6421 10.172 14.8068 9.78727 15.6572 9.78727L16.7418 9.78679V8.04265C16.5542 8.01893 15.9103 7.96582 15.1614 7.96582C13.5975 7.96582 12.5269 8.87459 12.5269 10.5435V11.9817H10.7583V13.9317H12.5269V18.9355H14.6422V18.9355Z"
        fill={theme.colors.black}
      />
    </Svg>
  );
};

export default Icon;
