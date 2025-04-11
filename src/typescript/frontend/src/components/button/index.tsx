"use client";

import { EXTERNAL_LINK_PROPS } from "components/link";
import SpinnerIcon from "components/svg/icons/Spinner";
import Text from "components/text";
import React from "react";
import { useScramble, type UseScrambleProps } from "use-scramble";

import { FlexGap } from "@/containers";

import StyledButton from "./styled";
import type { ButtonProps } from "./types";

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
  scrambleProps = {},
  icon,
  ...rest
}: ButtonProps<E> & { scrambleProps?: UseScrambleProps } & {
  icon?: React.ReactNode;
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
    textTransform: "uppercase" as const,
    fontSize:
      scale === "sm" ? ("20px" as const) : scale === "lg" ? ("24px" as const) : ("36px" as const),
  };

  const isChildrenString = typeof children === "string";
  const shouldScramble = isScramble && isChildrenString && !disabled;

  return (
    <StyledButton
      {...internalProps}
      {...rest}
      variant={variant}
      type={rest.type || "button"}
      disabled={isDisabled}
      $isLoading={isLoading}
      scale={scale}
      onMouseOver={shouldScramble ? replay : undefined}
      onFocus={shouldScramble ? replay : undefined}
    >
      {isLoading ? (
        <SpinnerIcon />
      ) : (
        <>
          {React.isValidElement(startIcon) &&
            React.cloneElement(startIcon, {
              mr: "0.5rem",
            })}

          <FlexGap gap="8px" justifyContent="space-between">
            <Text {...textProps}>{"{ "}</Text>
            {icon && (
              <Text {...textProps} className="flex flex-row">
                {icon}
              </Text>
            )}
            <Text
              {...textProps}
              ref={shouldScramble ? ref : undefined}
              style={
                typeof children === "string"
                  ? { minWidth: `${children.length + 1}ch`, textAlign: "center" }
                  : {}
              }
            >
              {!shouldScramble ? children : null}
            </Text>
            <Text {...textProps}>{" }"}</Text>
          </FlexGap>

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
