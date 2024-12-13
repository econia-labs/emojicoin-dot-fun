"use client";

import React from "react";
import Svg from "components/svg/Svg";
import { type SvgProps } from "../types";
import { darkColors } from "theme";

const Icon: React.FC<SvgProps> = ({ color = "darkGray", ...props }) => {
  return (
    <Svg width="66" height="18" viewBox="0 0 66 18" fill={darkColors[color]} {...props}>
    <path d="M0.920363 3.85344C-0.0148085 2.52861 0.932661 0.700073 2.5543 0.700073H29.2994H58.8468C59.5084 0.700073 60.1272 1.02729 60.4997 1.57411L64.9785 8.14897C65.4154 8.79036 65.4429 9.62479 65.0392 10.2876C63.9494 12.0771 61.753 15.5992 60.4232 17.1568C60.1082 17.5257 59.6369 17.7001 59.1517 17.7001H29.2994H2.5543C0.932664 17.7001 -0.0148085 15.8715 0.920363 14.5467L3.88032 10.3534C4.3684 9.66199 4.3684 8.73816 3.88032 8.04671L0.920363 3.85344Z" fill={darkColors[color]}/>
    </Svg>
  );
};

export default Icon;
