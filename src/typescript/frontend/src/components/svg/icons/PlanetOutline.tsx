import React from "react";
import Svg from "components/svg/Svg";

import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "black", ...props }) => {
  const { theme } = useThemeContext();

  return (
    <Svg viewBox="0 0 28 27" {...props} color="transparent">
      <circle cx="14.2512" cy="13.4504" r="12.9504" stroke={theme.colors[color]} />
      <path
        d="M14.2519 22.117C15.9659 22.1167 17.6413 21.6082 19.0663 20.6558C20.4912 19.7034 21.6018 18.3499 22.2576 16.7663C22.9134 15.1828 23.0849 13.4403 22.7505 11.7593C22.416 10.0783 21.5907 8.53421 20.3787 7.32225C19.1667 6.11029 17.6226 5.28491 15.9416 4.95047C14.2606 4.61603 12.5182 4.78754 10.9346 5.44332C9.35107 6.0991 7.99752 7.2097 7.04513 8.6347C6.09273 10.0597 5.58425 11.7351 5.58398 13.4491C5.58381 14.5874 5.80789 15.7146 6.24343 16.7663C6.67897 17.8181 7.31743 18.7737 8.12236 19.5786C8.92728 20.3835 9.88289 21.022 10.9346 21.4575C11.9863 21.8931 13.1136 22.1171 14.2519 22.117V22.117Z"
        stroke={theme.colors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.01953 16.168H22.2379"
        stroke={theme.colors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.01953 10.73H22.2379"
        stroke={theme.colors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3809 4.98633C10.8254 10.5988 11.0544 16.5561 13.0362 22.0326"
        stroke={theme.colors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.119 4.98633C16.7985 7.42881 17.1415 9.95258 17.1386 12.4878C17.1455 15.7422 16.5823 18.9725 15.4746 22.0326"
        stroke={theme.colors[color]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Icon;
