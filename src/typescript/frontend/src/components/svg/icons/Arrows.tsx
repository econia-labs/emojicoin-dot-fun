import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { useThemeContext } from "context";

const Icon: React.FC<SvgProps> = ({ color = "darkGray", ...props }) => {
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.0664 16.2974L11.4795 16.2974L11.4795 14.7105L13.0664 14.7105L13.0664 16.2974ZM14.6861 13.0908L14.6861 14.7105L13.0664 14.7105L13.0664 13.0908L14.6861 13.0908ZM11.4795 14.7105L9.85982 14.7105L9.85982 13.0908L11.4795 13.0908L11.4795 14.7105ZM16.2729 11.5039L16.2729 13.0908L14.6861 13.0908L14.6861 11.5039L16.2729 11.5039ZM9.85982 13.0908L8.27295 13.0908L8.27295 11.5039L9.85982 11.5039L9.85982 13.0908Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.48 10.7242L13.0669 10.7242L13.0669 12.311L11.48 12.311L11.48 10.7242Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.4795 8.45024L13.0664 8.45024L13.0664 10.0371L11.4795 10.0371L11.4795 8.45024Z"
        fill={theme.colors[color]}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.48 6.17632L13.0669 6.17632L13.0669 7.76318L11.48 7.76318L11.48 6.17632Z"
        fill={theme.colors[color]}
      />
    </Svg>
  );
};

export default Icon;
