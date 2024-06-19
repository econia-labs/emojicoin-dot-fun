"use client";

import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { darkColors } from "theme";

const Icon: React.FC<SvgProps> = ({ color = "darkGray", ...props }) => {

  return (
    <Svg viewBox="0 0 19 22" color="transparent" {...props}>
      <g clipPath="url(#clip0_14173_4961)">
        <path
          d="M18.8572 9.4367L18.8572 13.2213L15.0727 13.2213L15.0727 9.4367L18.8572 9.4367ZM11.2098 5.5739L15.0727 5.5739L15.0727 9.4367L11.2098 9.4367L11.2098 5.5739ZM15.0727 13.2213L15.0727 17.0841L11.2098 17.0841L11.2098 13.2213L15.0727 13.2213ZM7.42529 1.7893L11.2098 1.7893L11.2098 5.5739L7.42529 5.5739L7.42529 1.7893ZM11.2098 17.0841L11.2098 20.8687L7.42529 20.8687L7.42529 17.0841L11.2098 17.0841Z"
          fill={darkColors[color]}
          className={props.className}
        />
        <path
          d="M5.56494 13.2202L5.56494 9.43565L9.34948 9.43565L9.34948 13.2202L5.56494 13.2202Z"
          fill={darkColors[color]}
          className={props.className}
        />
        <path
          d="M0.14209 13.2212L0.14209 9.43665L3.92663 9.43665L3.92663 13.2212L0.14209 13.2212Z"
          fill={darkColors[color]}
          className={props.className}
        />
      </g>
      <defs>
        <clipPath id="clip0_14173_4961">
          <rect width="21" height="19" fill="white" transform="translate(0 21.8284) rotate(-90)" />
        </clipPath>
      </defs>
    </Svg>
  );
};

export default Icon;
