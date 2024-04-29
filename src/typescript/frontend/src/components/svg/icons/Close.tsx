import React from "react";
import { Svg } from "components";
import { SvgProps } from "../types";

const Icon: React.FC<SvgProps> = props => {
  return (
    <Svg viewBox="0 0 14 16" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.71 8.23l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75L1 11.98l3.75-3.75L1 4.48 2.48 3l3.75 3.75L9.98 3l1.48 1.48-3.75 3.75z"
      />
    </Svg>
  );
};

export default Icon;
