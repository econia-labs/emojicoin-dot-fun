// cspell:word istouched
import { scales as inputScales } from "components/inputs/input/types";
import { Text } from "components/text";
import React, { cloneElement } from "react";

import { InputError, InputIcon, InputInner, InputWrapper, StyledInputGroup } from "./styled";
import { type InputGroupProps, variants } from "./types";

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
  inputWrapperStyles,
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

        <InputWrapper style={inputWrapperStyles}>
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
