import React, { type SVGProps } from "react";
import styled from "styled-components";

export const StyledCloseIcon = styled.div`
  cursor: pointer;
  opacity: 1;
  transition: all 0.15s ease-in-out;

  & > svg {
    width: 26px;
  }

  &:hover > svg {
    transition: inherit;
    scale: 1.25;
    rotate: 90deg;
  }
`;

export const CloseIconWithHover = (props: SVGProps<SVGSVGElement>) => {
  return (
    <StyledCloseIcon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        strokeWidth={2.75}
        stroke="currentColor"
        {...props}
        className={props.className}
      >
        <path strokeLinecap="butt" strokeLinejoin="inherit" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </StyledCloseIcon>
  );
};

export default CloseIconWithHover;
