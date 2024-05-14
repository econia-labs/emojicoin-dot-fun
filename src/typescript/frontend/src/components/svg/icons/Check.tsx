import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "lightGrey", ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Svg viewBox="0 0 18 12" {...props} fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.0892 0.410704C17.4147 0.736141 17.4147 1.26378 17.0892 1.58922L7.08922 11.5892C6.76378 11.9147 6.23614 11.9147 5.9107 11.5892L0.910704 6.58922C0.585267 6.26378 0.585267 5.73614 0.910704 5.4107C1.23614 5.08527 1.76378 5.08527 2.08922 5.4107L6.49996 9.82145L15.9107 0.410704C16.2361 0.0852667 16.7638 0.0852667 17.0892 0.410704Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
