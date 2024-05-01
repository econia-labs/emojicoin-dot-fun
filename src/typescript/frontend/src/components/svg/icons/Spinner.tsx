import React from "react";
import { Svg } from "components";
import { SvgProps } from "../types";

const Icon: React.FC<SvgProps> = ({ ...props }) => {
  return (
    <Svg viewBox="0 0 24 24" spin {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.25C7.16751 3.25 3.25 7.16751 3.25 12C3.25 16.8325 7.16751 20.75 12 20.75C16.8325 20.75 20.75 16.8325 20.75 12C20.75 11.3096 21.3096 10.75 22 10.75C22.6904 10.75 23.25 11.3096 23.25 12C23.25 18.2132 18.2132 23.25 12 23.25C5.7868 23.25 0.75 18.2132 0.75 12C0.75 5.7868 5.7868 0.75 12 0.75C12.6904 0.75 13.25 1.30964 13.25 2C13.25 2.69036 12.6904 3.25 12 3.25Z"
      />
    </Svg>
  );
};

export default Icon;
