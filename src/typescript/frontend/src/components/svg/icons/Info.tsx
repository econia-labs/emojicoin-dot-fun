import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";

const Icon: React.FC<SvgProps> = ({ color = "blue", ...props }) => {
  return (
    <Svg viewBox="0 0 20 20" color={color} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10ZM20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10ZM9 6C9 5.44772 9.44771 5 10 5C10.5523 5 11 5.44772 11 6C11 6.55228 10.5523 7 10 7C9.44771 7 9 6.55228 9 6ZM9 9C9 8.44771 9.44771 8 10 8C10.5523 8 11 8.44771 11 9V15C11 15.5523 10.5523 16 10 16C9.44771 16 9 15.5523 9 15V9Z"
      />
    </Svg>
  );
};

export default Icon;
