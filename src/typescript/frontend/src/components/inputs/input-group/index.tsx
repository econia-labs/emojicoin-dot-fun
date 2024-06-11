// cspell:word istouched
import React, { cloneElement } from "react";
import { InputError, InputIcon, InputWrapper, StyledInputGroup, InputInner } from "./styled";
import { Text } from "components/text";

import { type InputGroupProps, variants } from "./types";
import { scales as inputScales } from "components/inputs/input/types";

export const InputGroup: React.FC<InputGroupProps> = ({
  scale = inputScales.MD,
  startIcon,
  endIcon,
  children,
  error,
  label,
  touched,
  isShowError = true,
  variant,
  forId,
  textScale = "heading1",
  ...props
}) => {
  return (
    <StyledInputGroup
      scale={scale}
      width="100%"
      hasStartIcon={!!startIcon}
      hasEndIcon={!!endIcon}
      {...props}
    >
      <InputInner variant={variant}>
        {label && (
          <Text
            as={variant === variants.FANTOM ? "label" : undefined}
            textScale={textScale}
            color="white"
            mb="20px"
            textTransform="uppercase"
            htmlFor={forId}
            className={props.className}
          >
            {label}
          </Text>
        )}

        <InputWrapper>
          {startIcon && <InputIcon scale={scale}>{startIcon}</InputIcon>}

          {cloneElement(children, { scale, error, touched })}

          {endIcon && (
            <InputIcon scale={scale} isEndIcon>
              {endIcon}
            </InputIcon>
          )}
        </InputWrapper>
      </InputInner>

      {isShowError && (
        <InputError textScale="bodyXSmall">{error && touched ? error : " "}</InputError>
      )}
    </StyledInputGroup>
  );
};
