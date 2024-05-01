import React from "react";

import StyledButton from "./styled";
import { SpinnerIcon } from "components/svg";

import { ButtonProps } from "./types";

export const getExternalLinkProps = () => ({
  target: "_blank",
  rel: "noreferrer noopener",
});

const Button = <E extends React.ElementType = "button">(props: ButtonProps<E>): JSX.Element => {
  const { startIcon, endIcon, children, isLoading, disabled, external, ...rest } = props;
  const isDisabled = isLoading || disabled;
  const internalProps = external ? getExternalLinkProps() : {};

  return (
    <StyledButton
      {...internalProps}
      {...rest}
      type={props.type || "button"}
      disabled={isDisabled}
      $isLoading={isLoading}
    >
      {isLoading ? (
        <SpinnerIcon />
      ) : (
        <>
          {React.isValidElement(startIcon) &&
            React.cloneElement(startIcon, {
              mr: "0.5rem",
            })}

          {`{ ${children} }`}

          {React.isValidElement(endIcon) &&
            React.cloneElement(endIcon, {
              ml: "0.5rem",
            })}
        </>
      )}
    </StyledButton>
  );
};

Button.defaultProps = {
  isLoading: false,
  variant: "outline",
  scale: "sm",
  disabled: false,
};

export default Button;
