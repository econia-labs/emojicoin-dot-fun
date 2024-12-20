"use client";

import React from "react";
import { useScramble, type UseScrambleProps } from "use-scramble";

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
  fakeDisabled = false,
  external,
  isScramble = true,
  scale = "sm",
  variant = "outline",
  scrambleProps = {},
  icon,
  ...rest
}: ButtonProps<E> & { scrambleProps?: UseScrambleProps } & {
  icon?: React.ReactNode;
  fakeDisabled?: boolean;
}): JSX.Element => {
  const isDisabled = isLoading || disabled;
  const internalProps = external ? EXTERNAL_LINK_PROPS : {};

  const { ref, replay } = useScramble({
    text: isScramble ? `${children}` : undefined,
    overdrive: false,
    speed: 0.5,
    ...scrambleProps,
  });

  const textProps = {
    textScale: "pixelHeading4" as const,
    color: isDisabled || fakeDisabled ? ("darkGray" as const) : ("econiaBlue" as const),
    textTransform: "uppercase" as const,
    fontSize: scale === "sm" ? "20px" : ("24px" as const),
  };

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
            <FlexGap gap="8px" onMouseOver={replay} className="h-[1em]">
              <Text {...textProps}>{"{ "}</Text>
              {icon && (
                <Text {...textProps} className="flex flex-row">
                  {icon}
                </Text>
              )}
              <Text {...textProps} className="flex flex-row">
                {children}
              </Text>
              <Text {...textProps}>{" }"}</Text>
            </FlexGap>
          ) : (
            <FlexGap gap="8px" onMouseOver={replay} className="h-[1em]">
              <Text {...textProps}>{"{ "}</Text>
              {icon && (
                <Text {...textProps} className="flex flex-row">
                  {icon}
                </Text>
              )}
              <Text {...textProps} ref={isScramble ? ref : undefined} />
              <Text {...textProps}>{" }"}</Text>
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
