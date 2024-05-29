"use client";

import React from "react";

import { StyledCheckbox, StyledInput, CustomCheckbox } from "./styled";
import CheckIcon from "components/svg/icons/Check";
import { Text } from "components/text";

import { type CheckboxProps } from "./types";

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  icon = <CheckIcon width="16px" />,
  disabled,
  onChange,
  ...props
}) => {
  return (
    <StyledCheckbox {...props} disabled={disabled}>
      <StyledInput type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />

      <CustomCheckbox checked={checked} disabled={disabled}>
        {checked && icon}
      </CustomCheckbox>

      {typeof label === "string" ? (
        <Text textScale="display6" color="lightGray" mx="18px">
          {label}
        </Text>
      ) : (
        React.isValidElement(label) && label
      )}
    </StyledCheckbox>
  );
};

export default Checkbox;
