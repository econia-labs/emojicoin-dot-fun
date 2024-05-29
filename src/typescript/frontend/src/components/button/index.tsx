"use client";

import React from "react";
import { useScramble } from "use-scramble";

import StyledButton from "./styled";
import SpinnerIcon from "components/svg/icons/Spinner";
import { Text } from "components/text";
import { FlexGap } from "@containers";

import { type ButtonProps } from "./types";
import { EXTERNAL_LINK_PROPS } from "components/link";

const Button = <E extends React.ElementType = "button">({
  startIcon,
  endIcon,
  children,
  isLoading = false,
  disabled = false,
  external,
  isScramble = true,
  scale = "sm",
  variant = "outline",
  ...rest
}: ButtonProps<E>): JSX.Element => {
  const isDisabled = isLoading || disabled;
  const internalProps = external ? EXTERNAL_LINK_PROPS : {};

  const { ref, replay } = useScramble({
    text: isScramble ? `${children}` : undefined,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <StyledButton
      {...internalProps}
      {...rest}
      varian={variant}
      type={rest.type || "button"}
      disabled={isDisabled}
      $isLoading={isLoading}
      scale={scale}
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

          {!isScramble ? (
            `{ ${children} }`
          ) : (
            <FlexGap gap="8px" onMouseOver={replay}>
              <Text
                textScale="pixelHeading4"
                color="econiaBlue"
                textTransform="uppercase"
                fontSize={scale === "sm" ? "20px" : "24px"}
              >
                {"{ "}
              </Text>
              <Text
                textScale="pixelHeading4"
                color="econiaBlue"
                textTransform="uppercase"
                fontSize={scale === "sm" ? "20px" : "24px"}
                ref={isScramble ? ref : undefined}
              />
              <Text
                textScale="pixelHeading4"
                color="econiaBlue"
                textTransform="uppercase"
                fontSize={scale === "sm" ? "20px" : "24px"}
              >
                {" }"}
              </Text>
            </FlexGap>
          )}

          {React.isValidElement(endIcon) &&
            React.cloneElement(endIcon, {
              ml: "0.5rem",
            })}
        </>
      )}
    </StyledButton>
  );
};

export default Button;
