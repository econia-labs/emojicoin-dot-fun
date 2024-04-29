import React from "react";
import { StyledCloseIcon } from "./styled";
import { CloseIcon } from "components/svg";
import { CloseIconWithHoverProps } from "./types";

export const CloseIconWithHover: React.FC<CloseIconWithHoverProps> = ({ onClick, ...props }) => {
  return (
    <StyledCloseIcon onClick={onClick}>
      <CloseIcon {...props} />
    </StyledCloseIcon>
  );
};
