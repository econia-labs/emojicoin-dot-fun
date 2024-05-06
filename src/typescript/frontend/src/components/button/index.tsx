import React from "react";
import { useScramble } from "use-scramble";

import StyledButton from "./styled";
import { SpinnerIcon } from "components/svg";

import { ButtonProps } from "./types";

export const getExternalLinkProps = () => ({
  target: "_blank",
  rel: "noreferrer noopener",
});

const Button = <E extends React.ElementType = "button">(props: ButtonProps<E>): JSX.Element => {
  const { startIcon, endIcon, children, isLoading, disabled, external, isScramble = true, ...rest } = props;
  const isDisabled = isLoading || disabled;
  const internalProps = external ? getExternalLinkProps() : {};

  const { ref, replay } = useScramble({
    text: isScramble ? `{ ${children} }` : undefined,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledButton
      {...internalProps}
      {...rest}
      type={props.type || "button"}
      disabled={isDisabled}
      $isLoading={isLoading}
      ref={isScramble ? ref : undefined}
      onMouseOver={isScramble ? replay : undefined}
      onFocus={isScramble ? replay : undefined}
    >
      {isLoading ? (
        <SpinnerIcon />
      ) : (
        <>
          {React.isValidElement(startIcon) &&
            React.cloneElement(startIcon, {
              mr: "0.5rem",
            })}

          {!isScramble ? `{ ${children} }` : null}

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
